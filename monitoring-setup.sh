#!/bin/bash

# =============================================================================
# RemoteHive Monitoring and Logging Setup
# =============================================================================
# This script sets up comprehensive monitoring and logging for RemoteHive
# Includes Prometheus, Grafana, ELK Stack, and custom dashboards
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
LOG_FILE="$PROJECT_ROOT/monitoring-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="development"
MONITORING_NAMESPACE="remotehive-monitoring"
VERBOSE=false
DRY_RUN=false
FORCE=false
SKIP_DOCKER=false
SKIP_K8S=false

# Service ports
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ALERTMANAGER_PORT=9093
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
LOGSTASH_PORT=5044
JAEGER_PORT=16686

# =============================================================================
# Utility Functions
# =============================================================================

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Progress indicator
show_progress() {
    local current=$1
    local total=$2
    local message="$3"
    local percent=$((current * 100 / total))
    local bar_length=50
    local filled_length=$((percent * bar_length / 100))
    
    printf "\r${CYAN}[%3d%%]${NC} " "$percent"
    printf "["
    printf "%*s" "$filled_length" | tr ' ' '█'
    printf "%*s" "$((bar_length - filled_length))" | tr ' ' '░'
    printf "] %s" "$message"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    log "ERROR" "An error occurred on line $line_number. Exit code: $exit_code"
    cleanup
    exit $exit_code
}

# Cleanup function
cleanup() {
    log "DEBUG" "Performing cleanup..."
    
    # Remove temporary files
    if [[ -d "$PROJECT_ROOT/tmp" ]]; then
        find "$PROJECT_ROOT/tmp" -name "*.tmp" -delete 2>/dev/null || true
    fi
}

# Trap errors
trap 'handle_error $LINENO' ERR
trap cleanup EXIT

# =============================================================================
# Validation Functions
# =============================================================================

# Validate environment
validate_environment() {
    log "INFO" "Validating environment..."
    
    # Check required commands
    local required_commands=("docker" "docker-compose")
    
    if [[ "$SKIP_K8S" != "true" ]]; then
        required_commands+=("kubectl")
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log "ERROR" "Required command not found: $cmd"
            return 1
        fi
    done
    
    # Check Docker daemon
    if [[ "$SKIP_DOCKER" != "true" ]]; then
        if ! docker info >/dev/null 2>&1; then
            log "ERROR" "Docker daemon is not running"
            return 1
        fi
    fi
    
    # Check Kubernetes cluster
    if [[ "$SKIP_K8S" != "true" ]]; then
        if ! kubectl cluster-info >/dev/null 2>&1; then
            log "WARN" "Kubernetes cluster not accessible. Skipping K8s setup."
            SKIP_K8S=true
        fi
    fi
    
    log "SUCCESS" "Environment validation completed"
}

# Check port availability
check_port_availability() {
    local ports=("$PROMETHEUS_PORT" "$GRAFANA_PORT" "$ALERTMANAGER_PORT" "$ELASTICSEARCH_PORT" "$KIBANA_PORT" "$LOGSTASH_PORT" "$JAEGER_PORT")
    
    log "INFO" "Checking port availability..."
    
    for port in "${ports[@]}"; do
        if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
            log "WARN" "Port $port is already in use"
            if [[ "$FORCE" != "true" ]]; then
                log "ERROR" "Use --force to override port conflicts"
                return 1
            fi
        fi
    done
    
    log "SUCCESS" "Port availability check completed"
}

# =============================================================================
# Configuration Generation Functions
# =============================================================================

# Create Prometheus configuration
create_prometheus_config() {
    log "INFO" "Creating Prometheus configuration..."
    
    local config_dir="$MONITORING_DIR/prometheus"
    mkdir -p "$config_dir"
    
    cat > "$config_dir/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'remotehive'
    environment: '${ENVIRONMENT}'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # RemoteHive Backend API
  - job_name: 'remotehive-backend'
    static_configs:
      - targets: ['host.docker.internal:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # RemoteHive Autoscraper Service
  - job_name: 'remotehive-autoscraper'
    static_configs:
      - targets: ['host.docker.internal:8001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  # MongoDB
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']

  # Node Exporter
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # cAdvisor
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # Nginx (if used)
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
    scrape_interval: 30s

  # Blackbox exporter for endpoint monitoring
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://host.docker.internal:8000/health
        - http://host.docker.internal:8001/health
        - http://host.docker.internal:3000
        - http://host.docker.internal:5173
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
EOF

    # Create alerting rules
    mkdir -p "$config_dir/rules"
    
    cat > "$config_dir/rules/remotehive.yml" << 'EOF'
groups:
  - name: remotehive.rules
    rules:
      # Service availability
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service {{ $labels.job }} has been down for more than 1 minute."

      # High response time
      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.95"} > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.job }}"
          description: "95th percentile response time is {{ $value }}s for {{ $labels.job }}."

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value }} errors per second for {{ $labels.job }}."

      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}."

      # High memory usage
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}% on {{ $labels.instance }}."

      # Disk space low
      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}% on {{ $labels.instance }}."

      # Database connection issues
      - alert: DatabaseConnectionHigh
        expr: mongodb_connections{state="current"} > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "MongoDB has {{ $value }} active connections."

      # Redis memory usage
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High Redis memory usage"
          description: "Redis memory usage is {{ $value }}%."
EOF

    log "SUCCESS" "Prometheus configuration created"
}

# Create Grafana configuration
create_grafana_config() {
    log "INFO" "Creating Grafana configuration..."
    
    local config_dir="$MONITORING_DIR/grafana"
    mkdir -p "$config_dir/provisioning/datasources" "$config_dir/provisioning/dashboards" "$config_dir/dashboards"
    
    # Grafana configuration
    cat > "$config_dir/grafana.ini" << 'EOF'
[server]
http_port = 3001
root_url = http://localhost:3001

[security]
admin_user = admin
admin_password = ${GRAFANA_ADMIN_PASSWORD:-admin123}
secret_key = ${GRAFANA_SECRET_KEY:-SW2YcwTIb9zpOOhoPsMm}

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[auth.anonymous]
enabled = false

[log]
mode = console
level = info

[metrics]
enabled = true

[alerting]
enabled = true
EOF

    # Datasource configuration
    cat > "$config_dir/provisioning/datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    database: "logstash-*"
    interval: Daily
    timeField: "@timestamp"
    editable: true
EOF

    # Dashboard provisioning
    cat > "$config_dir/provisioning/dashboards/dashboards.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'RemoteHive Dashboards'
    orgId: 1
    folder: 'RemoteHive'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # Create RemoteHive overview dashboard
    create_grafana_dashboards "$config_dir/dashboards"
    
    log "SUCCESS" "Grafana configuration created"
}

# Create Grafana dashboards
create_grafana_dashboards() {
    local dashboard_dir="$1"
    
    log "INFO" "Creating Grafana dashboards..."
    
    # RemoteHive Overview Dashboard
    cat > "$dashboard_dir/remotehive-overview.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "RemoteHive Overview",
    "tags": ["remotehive", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Service Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"remotehive.*\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {
                    "text": "DOWN",
                    "color": "red"
                  },
                  "1": {
                    "text": "UP",
                    "color": "green"
                  }
                },
                "type": "value"
              }
            ]
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{job}} - {{method}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "{{job}} - 5xx errors"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

    # System Resources Dashboard
    cat > "$dashboard_dir/system-resources.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "System Resources",
    "tags": ["system", "resources"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{instance}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100",
            "legendFormat": "{{instance}} - {{mountpoint}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Network I/O",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total[5m])",
            "legendFormat": "{{instance}} - {{device}} RX"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total[5m])",
            "legendFormat": "{{instance}} - {{device}} TX"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

    log "SUCCESS" "Grafana dashboards created"
}

# Create Alertmanager configuration
create_alertmanager_config() {
    log "INFO" "Creating Alertmanager configuration..."
    
    local config_dir="$MONITORING_DIR/alertmanager"
    mkdir -p "$config_dir"
    
    cat > "$config_dir/alertmanager.yml" << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@remotehive.com'
  smtp_auth_username: '${SMTP_USERNAME}'
  smtp_auth_password: '${SMTP_PASSWORD}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/'

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@remotehive.com'
        subject: '[CRITICAL] RemoteHive Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
          {{ end }}
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#alerts'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'warning-alerts'
    email_configs:
      - to: 'team@remotehive.com'
        subject: '[WARNING] RemoteHive Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

    log "SUCCESS" "Alertmanager configuration created"
}

# Create ELK Stack configuration
create_elk_config() {
    log "INFO" "Creating ELK Stack configuration..."
    
    local config_dir="$MONITORING_DIR/elk"
    mkdir -p "$config_dir/elasticsearch" "$config_dir/logstash" "$config_dir/kibana"
    
    # Elasticsearch configuration
    cat > "$config_dir/elasticsearch/elasticsearch.yml" << 'EOF'
cluster.name: "remotehive-logs"
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true
EOF

    # Logstash configuration
    cat > "$config_dir/logstash/logstash.conf" << 'EOF'
input {
  beats {
    port => 5044
  }
  
  tcp {
    port => 5000
    codec => json_lines
  }
  
  http {
    port => 8080
    codec => json
  }
}

filter {
  if [fields][service] {
    mutate {
      add_field => { "service" => "%{[fields][service]}" }
    }
  }
  
  if [service] == "remotehive-backend" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log_message}" }
    }
  }
  
  if [service] == "remotehive-autoscraper" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log_message}" }
    }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
  }
  
  mutate {
    remove_field => [ "@version", "host", "agent", "ecs", "input", "log" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "remotehive-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
EOF

    # Kibana configuration
    cat > "$config_dir/kibana/kibana.yml" << 'EOF'
server.name: kibana
server.host: 0.0.0.0
server.port: 5601
elasticsearch.hosts: ["http://elasticsearch:9200"]
monitoring.ui.container.elasticsearch.enabled: true
EOF

    log "SUCCESS" "ELK Stack configuration created"
}

# =============================================================================
# Docker Compose Setup
# =============================================================================

# Create Docker Compose for monitoring stack
create_monitoring_docker_compose() {
    log "INFO" "Creating monitoring Docker Compose configuration..."
    
    cat > "$MONITORING_DIR/docker-compose.monitoring.yml" << 'EOF'
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: remotehive-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
    restart: unless-stopped

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: remotehive-grafana
    ports:
      - "3001:3001"
    volumes:
      - ./grafana:/etc/grafana
      - ./grafana/dashboards:/var/lib/grafana/dashboards
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin123}
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - monitoring
    restart: unless-stopped
    depends_on:
      - prometheus

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: remotehive-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring
    restart: unless-stopped

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: remotehive-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring
    restart: unless-stopped

  # cAdvisor
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: remotehive-cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker:/var/lib/docker:ro
    networks:
      - monitoring
    restart: unless-stopped

  # Blackbox Exporter
  blackbox-exporter:
    image: prom/blackbox-exporter:latest
    container_name: remotehive-blackbox-exporter
    ports:
      - "9115:9115"
    volumes:
      - ./blackbox:/etc/blackbox_exporter
    networks:
      - monitoring
    restart: unless-stopped

  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: remotehive-elasticsearch
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - ./elk/elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
      - elasticsearch_data:/usr/share/elasticsearch/data
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    networks:
      - monitoring
    restart: unless-stopped

  # Logstash
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: remotehive-logstash
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "9600:9600"
    volumes:
      - ./elk/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    environment:
      - "LS_JAVA_OPTS=-Xmx256m -Xms256m"
    networks:
      - monitoring
    depends_on:
      - elasticsearch
    restart: unless-stopped

  # Kibana
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: remotehive-kibana
    ports:
      - "5601:5601"
    volumes:
      - ./elk/kibana/kibana.yml:/usr/share/kibana/config/kibana.yml
    networks:
      - monitoring
    depends_on:
      - elasticsearch
    restart: unless-stopped

  # Jaeger
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: remotehive-jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  elasticsearch_data:

networks:
  monitoring:
    driver: bridge
EOF

    # Create blackbox exporter config
    mkdir -p "$MONITORING_DIR/blackbox"
    cat > "$MONITORING_DIR/blackbox/blackbox.yml" << 'EOF'
modules:
  http_2xx:
    prober: http
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []
      method: GET
      follow_redirects: true
      fail_if_ssl: false
      fail_if_not_ssl: false
      tls_config:
        insecure_skip_verify: false
      preferred_ip_protocol: "ip4"
EOF

    log "SUCCESS" "Monitoring Docker Compose configuration created"
}

# =============================================================================
# Kubernetes Setup
# =============================================================================

# Create Kubernetes monitoring manifests
create_k8s_monitoring_manifests() {
    if [[ "$SKIP_K8S" == "true" ]]; then
        log "INFO" "Skipping Kubernetes manifests creation"
        return 0
    fi
    
    log "INFO" "Creating Kubernetes monitoring manifests..."
    
    local k8s_dir="$MONITORING_DIR/k8s"
    mkdir -p "$k8s_dir"
    
    # Namespace
    cat > "$k8s_dir/namespace.yaml" << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: $MONITORING_NAMESPACE
  labels:
    name: $MONITORING_NAMESPACE
EOF

    # Prometheus deployment
    cat > "$k8s_dir/prometheus.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: $MONITORING_NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
        args:
        - '--config.file=/etc/prometheus/prometheus.yml'
        - '--storage.tsdb.path=/prometheus'
        - '--web.console.libraries=/etc/prometheus/console_libraries'
        - '--web.console.templates=/etc/prometheus/consoles'
        - '--storage.tsdb.retention.time=200h'
        - '--web.enable-lifecycle'
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        persistentVolumeClaim:
          claimName: prometheus-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: $MONITORING_NAMESPACE
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: $MONITORING_NAMESPACE
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF

    # Grafana deployment
    cat > "$k8s_dir/grafana.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: $MONITORING_NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_USER
          value: "admin"
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secret
              key: admin-password
        volumeMounts:
        - name: storage
          mountPath: /var/lib/grafana
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: grafana-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: $MONITORING_NAMESPACE
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-pvc
  namespace: $MONITORING_NAMESPACE
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
EOF

    log "SUCCESS" "Kubernetes monitoring manifests created"
}

# =============================================================================
# Application Integration
# =============================================================================

# Add monitoring to application code
setup_application_monitoring() {
    log "INFO" "Setting up application monitoring integration..."
    
    # Create monitoring middleware for FastAPI
    local backend_monitoring_dir="$PROJECT_ROOT/app/middleware"
    mkdir -p "$backend_monitoring_dir"
    
    cat > "$backend_monitoring_dir/monitoring.py" << 'EOF'
import time
import logging
from typing import Callable
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import psutil
import asyncio

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Counter(
    'active_connections_total',
    'Total active connections'
)

DATABASE_OPERATIONS = Counter(
    'database_operations_total',
    'Total database operations',
    ['operation', 'collection']
)

CELERY_TASKS = Counter(
    'celery_tasks_total',
    'Total Celery tasks',
    ['task_name', 'status']
)

SYSTEM_CPU_USAGE = Histogram(
    'system_cpu_usage_percent',
    'System CPU usage percentage'
)

SYSTEM_MEMORY_USAGE = Histogram(
    'system_memory_usage_percent',
    'System memory usage percentage'
)

logger = logging.getLogger(__name__)

async def monitoring_middleware(request: Request, call_next: Callable) -> Response:
    """Middleware to collect metrics for each request."""
    start_time = time.time()
    
    # Get request info
    method = request.method
    endpoint = request.url.path
    
    try:
        # Process request
        response = await call_next(request)
        status = response.status_code
        
        # Record metrics
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(time.time() - start_time)
        
        return response
        
    except Exception as e:
        # Record error metrics
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=500).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(time.time() - start_time)
        
        logger.error(f"Request failed: {str(e)}")
        raise

def record_database_operation(operation: str, collection: str):
    """Record database operation metrics."""
    DATABASE_OPERATIONS.labels(operation=operation, collection=collection).inc()

def record_celery_task(task_name: str, status: str):
    """Record Celery task metrics."""
    CELERY_TASKS.labels(task_name=task_name, status=status).inc()

async def collect_system_metrics():
    """Collect system metrics periodically."""
    while True:
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            SYSTEM_CPU_USAGE.observe(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            SYSTEM_MEMORY_USAGE.observe(memory_percent)
            
            await asyncio.sleep(30)  # Collect every 30 seconds
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {str(e)}")
            await asyncio.sleep(60)  # Wait longer on error

def get_metrics():
    """Get Prometheus metrics."""
    return generate_latest()
EOF

    # Create health check endpoint
    cat > "$PROJECT_ROOT/app/api/endpoints/health.py" << 'EOF'
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.middleware.monitoring import get_metrics, CONTENT_TYPE_LATEST
from fastapi.responses import Response
import redis
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health_check():
    """Comprehensive health check endpoint."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check MongoDB
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await client.admin.command('ping')
        health_status["services"]["mongodb"] = "healthy"
    except Exception as e:
        health_status["services"]["mongodb"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status

@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(get_metrics(), media_type=CONTENT_TYPE_LATEST)

@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe."""
    # Add specific readiness checks here
    return {"status": "ready"}

@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"status": "alive"}
EOF

    log "SUCCESS" "Application monitoring integration completed"
}

# =============================================================================
# Main Functions
# =============================================================================

# Deploy monitoring stack
deploy_monitoring_stack() {
    log "INFO" "Deploying monitoring stack..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would deploy monitoring stack"
        return 0
    fi
    
    # Deploy with Docker Compose
    if [[ "$SKIP_DOCKER" != "true" ]]; then
        log "INFO" "Starting monitoring services with Docker Compose..."
        
        cd "$MONITORING_DIR"
        docker-compose -f docker-compose.monitoring.yml up -d
        
        # Wait for services to be ready
        log "INFO" "Waiting for services to be ready..."
        
        local services=("prometheus:9090" "grafana:3001" "elasticsearch:9200")
        for service in "${services[@]}"; do
            local name=$(echo "$service" | cut -d':' -f1)
            local port=$(echo "$service" | cut -d':' -f2)
            
            log "INFO" "Waiting for $name to be ready..."
            
            local retries=30
            while [[ $retries -gt 0 ]]; do
                if curl -s "http://localhost:$port" >/dev/null 2>&1; then
                    log "SUCCESS" "$name is ready"
                    break
                fi
                
                retries=$((retries - 1))
                sleep 10
            done
            
            if [[ $retries -eq 0 ]]; then
                log "WARN" "$name may not be ready yet"
            fi
        done
    fi
    
    # Deploy to Kubernetes
    if [[ "$SKIP_K8S" != "true" ]]; then
        log "INFO" "Deploying to Kubernetes..."
        
        kubectl apply -f "$MONITORING_DIR/k8s/"
        
        # Wait for deployments
        kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n "$MONITORING_NAMESPACE"
        kubectl wait --for=condition=available --timeout=300s deployment/grafana -n "$MONITORING_NAMESPACE"
    fi
    
    log "SUCCESS" "Monitoring stack deployed successfully"
}

# Show monitoring URLs
show_monitoring_urls() {
    log "INFO" "Monitoring services are available at:"
    
    echo -e "${CYAN}Prometheus:${NC} http://localhost:$PROMETHEUS_PORT"
    echo -e "${CYAN}Grafana:${NC} http://localhost:$GRAFANA_PORT (admin/admin123)"
    echo -e "${CYAN}Alertmanager:${NC} http://localhost:$ALERTMANAGER_PORT"
    echo -e "${CYAN}Kibana:${NC} http://localhost:$KIBANA_PORT"
    echo -e "${CYAN}Jaeger:${NC} http://localhost:$JAEGER_PORT"
    
    if [[ "$SKIP_K8S" != "true" ]]; then
        echo -e "${CYAN}Kubernetes Grafana:${NC} kubectl port-forward svc/grafana 3000:3000 -n $MONITORING_NAMESPACE"
    fi
}

# Show usage information
show_usage() {
    cat << EOF
RemoteHive Monitoring and Logging Setup

Usage: $0 [OPTIONS] COMMAND

COMMANDS:
    setup                     Complete monitoring setup
    deploy                    Deploy monitoring stack
    config                    Generate configurations only
    urls                      Show monitoring service URLs
    cleanup                   Remove monitoring stack

OPTIONS:
    -e, --environment <env>   Environment (development|staging|production)
    -v, --verbose             Enable verbose output
    -d, --dry-run             Show what would be done without making changes
    -f, --force               Force operation without confirmation
    --skip-docker             Skip Docker Compose setup
    --skip-k8s                Skip Kubernetes setup
    -h, --help                Show this help message

EXAMPLES:
    $0 setup                          Complete monitoring setup
    $0 deploy --environment production Deploy for production
    $0 config --skip-k8s              Generate configs without K8s

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-k8s)
                SKIP_K8S=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            setup|deploy|config|urls|cleanup)
                COMMAND="$1"
                shift
                break
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                log "ERROR" "Unknown command: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    log "INFO" "RemoteHive Monitoring Setup started"
    log "DEBUG" "Environment: $ENVIRONMENT"
    
    # Create necessary directories
    mkdir -p "$MONITORING_DIR" "$PROJECT_ROOT/tmp"
    
    # Execute command
    case "${COMMAND:-setup}" in
        "setup")
            validate_environment
            check_port_availability
            create_prometheus_config
            create_grafana_config
            create_alertmanager_config
            create_elk_config
            create_monitoring_docker_compose
            create_k8s_monitoring_manifests
            setup_application_monitoring
            deploy_monitoring_stack
            show_monitoring_urls
            ;;
        "deploy")
            validate_environment
            deploy_monitoring_stack
            show_monitoring_urls
            ;;
        "config")
            create_prometheus_config
            create_grafana_config
            create_alertmanager_config
            create_elk_config
            create_monitoring_docker_compose
            create_k8s_monitoring_manifests
            setup_application_monitoring
            ;;
        "urls")
            show_monitoring_urls
            ;;
        "cleanup")
            log "INFO" "Cleaning up monitoring stack..."
            if [[ "$SKIP_DOCKER" != "true" ]]; then
                cd "$MONITORING_DIR"
                docker-compose -f docker-compose.monitoring.yml down -v
            fi
            if [[ "$SKIP_K8S" != "true" ]]; then
                kubectl delete namespace "$MONITORING_NAMESPACE" --ignore-not-found=true
            fi
            log "SUCCESS" "Monitoring stack cleanup completed"
            ;;
        *)
            log "ERROR" "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Monitoring setup completed successfully"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse arguments and run main function
    parse_arguments "$@"
    main
fi