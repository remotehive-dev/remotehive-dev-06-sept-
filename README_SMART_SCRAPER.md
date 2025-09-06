Build a new Django app named "autoscraper" and add a left-nav item in the existing admin panel called “Smart AutoScraper” at /admin-panel/autoscraper/. This page must manage a large-scale, in-house auto-scraping engine that ingests real job posts primarily from RSS feeds (with HTML fallback) across global job boards, saves raw data automatically, schedules recurring runs, and exposes one-click controls: Start, Pause, Resume, Stop, Hard Reset.

TECH + LIBS (free only): Django 5, Django ORM to Postgres/Supabase; Celery + Redis (or RQ) for workers; APScheduler or Celery Beat for schedules; feedparser for RSS; requests + BeautifulSoup4 + lxml + dateparser for HTML fallback; python-json-logger; tenacity for retries; pydantic for payload validation; tldextract for per-domain limits; hashlib for dedupe.

DATA MODEL (models.py):
- JobBoard(id UUID pk, name str, base_url str, rss_url str nullable, region str, is_active bool, notes text, created_by fk User, created_at, updated_at).
- ScheduleConfig(id UUID, board fk JobBoard nullable (null = global), cron str OR interval_minutes int, timezone str, is_paused bool, next_run_dt datetime nullable, last_run_dt datetime nullable, max_concurrency int default 2, rate_limit_per_min int default 30, enabled bool).
- ScrapeJob(id UUID, board fk JobBoard nullable, mode choice[‘rss’, ‘html’, ‘auto’], status choice[‘queued’, ‘running’, ‘paused’, ‘stopped’, ‘succeeded’, ‘failed’, ‘canceled’], requested_by fk User nullable, started_at, finished_at, total_found int=0, total_saved int=0, error text nullable).
- ScrapeRun(id UUID, job fk ScrapeJob, target_url str, status choice as above, started_at, finished_at, items_found int=0, items_saved int=0, http_status int nullable, error text nullable, logs JSONB).
- RawJob(id UUID, source_url str unique, board fk JobBoard nullable, raw jsonb, fetched_at, checksum char(64), posted_at datetime nullable, source_title str nullable, source_company str nullable, UNIQUE(checksum)).
- NormalizedJob(id UUID, raw fk RawJob unique, title str, company str, location str, remote bool nullable, employment_type str nullable, description text, tags array(str), salary str nullable, apply_url str, posted_at datetime, region str, quality_score float default 0.0, is_published bool default false, created_at).
- EngineState(singleton key str pk='autoscraper', status choice[‘idle’, ‘running’, ‘paused’], last_heartbeat datetime, worker_count int, queue_depth int).
Add DB indexes on (posted_at), (company), (checksum), (region), and trigram index on title if pg_trgm available. Dedupe rule: checksum = SHA256(lower(title)+'|'+lower(company)+'|'+date(posted_at)+'|'+netloc(source_url)).

SERVICES & TASKS:
- celery.py configured; queues: autoscraper.default, autoscraper.heavy.
- tasks.py:
  * run_scrape_job(job_id): orchestrates; for each board resolves rss_url; if rss present -> fetch_rss_entries; else find common RSS patterns (/jobs/rss, /feed, ?format=rss) then fallback to html_scrape(board.base_url or supplied search URL).
  * fetch_rss_entries(board, job_id): uses feedparser with ETag/Last-Modified caching; map fields (title, link, published, summary); push each to persist_raw_item().
  * html_scrape(url, job_id): requests with rotating UA, retries (tenacity), politeness (rate limit per domain), parse with BS4; heuristics for job cards; if none, attempt trafilatura-like simplified text using readability-lxml to extract article; always persist as RawJob if minimally viable (title+link).
  * persist_raw_item(item, board): compute checksum, upsert RawJob; normalize_raw(raw) -> NormalizedJob (title/company/location parsing using light rules + regex for salary + dateparser).
  * compute_quality_score(normalized): score by completeness (title, company, location), recency, presence of salary, length of description, domain trustlist.
  * publish_to_feed(filters): mark is_published True and enqueue to existing Job Feed table via signal or service function.
  * maintenance: prune_old_raw(days=120), reindex_failed_runs(), heartbeat() updates EngineState.

API (views.py / api.py, DRF optional but not required):
- POST /admin-panel/autoscraper/jobs/start {board_id|null, mode:‘auto’|‘rss’|‘html’} -> creates ScrapeJob, enqueues run_scrape_job.
- POST /admin-panel/autoscraper/jobs/pause {job_id} -> set status paused; workers check Redis key to cooperatively pause.
- POST /admin-panel/autoscraper/jobs/resume {job_id}
- POST /admin-panel/autoscraper/jobs/stop {job_id} -> cancel remaining tasks, mark stopped.
- POST /admin-panel/autoscraper/hard-reset -> purge queues for autoscraper.* and set EngineState->idle.
- POST /admin-panel/autoscraper/schedules/upsert {board_id|null, cron or interval_minutes, timezone, rate_limit_per_min, max_concurrency, enabled} -> create/update ScheduleConfig and register with Celery Beat/APScheduler.
- POST /admin-panel/autoscraper/boards/import CSV (name, url, rss_url?, region) and single create/edit endpoints.
- GET list endpoints for boards, schedules, jobs, runs; GET /health returns EngineState.

ADMIN UI (/templates/admin_panel/autoscraper/*.html, Tailwind):
- Page header “Smart AutoScraper”.
- Left: Boards table (search, region filter, active toggle), Upload CSV (drag & drop), Add Board modal (name, base_url, rss_url optional, region, notes).
- Right: Controls Card with buttons Start, Pause, Resume, Stop, Hard Reset; dropdown Mode; multiselect Boards; status pill bound to EngineState; heartbeat indicator.
- Scheduler Card: list schedules with cron/interval, enable/disable, next_run, last_run; “Add Schedule” modal (validate cron).
- Runs & Logs: live stream (SSE or polling) of ScrapeJob and ScrapeRun with progress bars; counters total_found/saved, errors; export logs JSON.
- Settings Card: global rate limit per domain, user-agent string, retries, timeout; save to a single row config table or Django settings.

ROUTING:
- urls.py (app): path('', dashboard_redirect to autoscraper_home), path('boards/', …), path('jobs/', …), path('schedules/', …), path('health/', …).
- Hook app urls under project: path('admin-panel/autoscraper/', include('autoscraper.urls', namespace='autoscraper')).
- Update existing admin sidebar to include link text “Smart AutoScraper”.

GOOGLE LOGIN BUTTON ON ADMIN LOGIN:
- Ensure django-allauth installed and configured; on login template add: <a href="{% provider_login_url 'google' %}" class="btn w-full">Continue with Google</a> alongside email/password.

PERMISSIONS:
- Only staff with perm autoscraper.can_manage may start/stop/pause/reset or edit schedules; read-only role autoscraper.can_view for viewing boards/logs.

DEDICATED ENGINE PROCESS:
- Provide a separate Celery worker command (run via PM2/systemd/Docker): celery -A <project> worker -Q autoscraper.default,autoscraper.heavy --concurrency=4; optional beat scheduler for periodic jobs. Admin panel controls communicate via DB/Redis flags so backend/UI remain in Django app but execution is isolated to the worker process.

MIGRATIONS & WIRES:
- Create migrations; register models in Django admin with list filters and actions; wire sidebar entry; add signals to auto-create EngineState on migrate.

DELIVERABLES:
- Complete models.py, admin.py, urls.py, views.py/api.py, tasks.py, celery.py, templates (home, boards, schedules, runs/logs, modals), static JS for polling/log tail.
- Management command autoscraper_demo_seed to add 10 common boards with regions.
- README with env variables (REDIS_URL, SUPABASE/PG URL), run commands: 
  1) python manage.py migrate 
  2) python manage.py createsuperuser 
  3) celery -A project worker -Q autoscraper.default,autoscraper.heavy --concurrency=4 
  4) celery -A project beat (or APScheduler inside Django) 
  5) python manage.py runserver.
Ensure minimal manual config; defaults sensible; engine should run with only Redis + Postgres available.
