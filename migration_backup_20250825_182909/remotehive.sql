PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE admin_logs (
	id INTEGER NOT NULL, 
	admin_user_id VARCHAR(36), 
	action VARCHAR(100) NOT NULL, 
	target_table VARCHAR(50), 
	target_id VARCHAR(50), 
	old_values TEXT, 
	new_values TEXT, 
	ip_address VARCHAR(45), 
	user_agent TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(admin_user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE TABLE ads (
	id INTEGER NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	type VARCHAR(50) NOT NULL, 
	position VARCHAR(50) NOT NULL, 
	status VARCHAR(50), 
	content TEXT, 
	script_code TEXT, 
	image_url VARCHAR(500), 
	link_url VARCHAR(500), 
	start_date DATETIME, 
	end_date DATETIME, 
	budget FLOAT, 
	clicks INTEGER, 
	impressions INTEGER, 
	revenue FLOAT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id)
);
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO "alembic_version" VALUES('rename_scraper_name');
CREATE TABLE analytics_metrics (
	id VARCHAR(36) NOT NULL, 
	scraper_config_id VARCHAR(36) NOT NULL, 
	execution_time FLOAT NOT NULL, 
	pages_processed INTEGER NOT NULL, 
	jobs_found INTEGER NOT NULL, 
	jobs_saved INTEGER NOT NULL, 
	success_rate FLOAT NOT NULL, 
	ml_parsing_enabled BOOLEAN DEFAULT 'false' NOT NULL, 
	ml_success_rate FLOAT, 
	ml_avg_confidence FLOAT, 
	api_calls_made INTEGER DEFAULT '0' NOT NULL, 
	errors_count INTEGER DEFAULT '0' NOT NULL, 
	memory_usage_mb FLOAT, 
	cpu_usage_percent FLOAT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scraper_config_id) REFERENCES scraper_configs (id) ON DELETE CASCADE
);
CREATE TABLE auto_apply_settings (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	is_enabled BOOLEAN, 
	max_applications_per_day INTEGER, 
	preferred_job_types TEXT, 
	preferred_locations TEXT, 
	min_salary INTEGER, 
	max_salary INTEGER, 
	salary_currency VARCHAR(10), 
	keywords_include TEXT, 
	keywords_exclude TEXT, 
	company_size_preference VARCHAR(50), 
	remote_only BOOLEAN, 
	cover_letter_template TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	UNIQUE (user_id)
);
CREATE TABLE contact_information (
	id INTEGER NOT NULL, 
	category VARCHAR(100) NOT NULL, 
	label VARCHAR(255) NOT NULL, 
	email VARCHAR(255), 
	phone VARCHAR(50), 
	address_line1 VARCHAR(255), 
	address_line2 VARCHAR(255), 
	city VARCHAR(100), 
	state VARCHAR(100), 
	country VARCHAR(100), 
	postal_code VARCHAR(20), 
	office_hours VARCHAR(255), 
	timezone VARCHAR(50), 
	description TEXT, 
	is_active BOOLEAN, 
	is_primary BOOLEAN, 
	display_order INTEGER, 
	meta_data JSON, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id)
);
CREATE TABLE contact_submissions (
	id INTEGER NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	subject VARCHAR(500) NOT NULL, 
	message TEXT NOT NULL, 
	inquiry_type VARCHAR(50) NOT NULL, 
	phone VARCHAR(50), 
	company_name VARCHAR(255), 
	status VARCHAR(50), 
	priority VARCHAR(20), 
	assigned_to VARCHAR(255), 
	admin_notes TEXT, 
	ip_address VARCHAR(45), 
	user_agent TEXT, 
	source VARCHAR(100), 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	resolved_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE csv_import_log (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	filename VARCHAR(255) NOT NULL, 
	file_size_bytes INTEGER NOT NULL, 
	total_rows INTEGER NOT NULL, 
	processed_rows INTEGER DEFAULT '0' NOT NULL, 
	successful_rows INTEGER DEFAULT '0' NOT NULL, 
	failed_rows INTEGER DEFAULT '0' NOT NULL, 
	validation_errors JSON, 
	processing_errors JSON, 
	status VARCHAR(20) DEFAULT 'pending' NOT NULL, 
	start_time DATETIME, 
	end_time DATETIME, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE csv_import_logs (
	id INTEGER NOT NULL, 
	upload_id VARCHAR(36) NOT NULL, 
	row_number INTEGER NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	job_id INTEGER, 
	error_message TEXT, 
	data JSON, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(upload_id) REFERENCES csv_imports (id) ON DELETE CASCADE, 
	FOREIGN KEY(job_id) REFERENCES job_posts (id)
);
CREATE TABLE csv_imports (
	id VARCHAR(36) NOT NULL, 
	filename VARCHAR(255) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	total_rows INTEGER NOT NULL, 
	valid_rows INTEGER, 
	invalid_rows INTEGER, 
	processed_rows INTEGER, 
	successful_imports INTEGER, 
	failed_imports INTEGER, 
	status VARCHAR(20) DEFAULT 'PENDING', 
	progress FLOAT, 
	config JSON, 
	error_message TEXT, 
	file_size_bytes INTEGER, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	started_at DATETIME, 
	completed_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE email_attachments (
	id VARCHAR(36) NOT NULL, 
	message_id VARCHAR(36) NOT NULL, 
	filename VARCHAR(255) NOT NULL, 
	content_type VARCHAR(100), 
	file_size INTEGER, 
	file_path VARCHAR(500), 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(message_id) REFERENCES email_messages (id)
);
CREATE TABLE email_folders (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	color VARCHAR(7), 
	is_system BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES email_users (id)
);
INSERT INTO "email_folders" VALUES('2d1ee291-d251-4b66-baee-5e4f7d28b735','2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','inbox','#3b82f6',1,'2025-08-12 08:41:14.224110','2025-08-12 08:41:14.224366');
INSERT INTO "email_folders" VALUES('8a6a5d3f-ab8d-484b-b2ef-7634fa33fc9d','2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','sent','#10b981',1,'2025-08-12 08:41:14.224830','2025-08-12 08:41:14.224838');
INSERT INTO "email_folders" VALUES('e047dd48-6092-4981-8a57-9e8e92f2dca2','2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','drafts','#f59e0b',1,'2025-08-12 08:41:14.224967','2025-08-12 08:41:14.224972');
INSERT INTO "email_folders" VALUES('fa30eff7-5110-4cdd-91c2-1a3e8d11d9d6','2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','spam','#ef4444',1,'2025-08-12 08:41:14.225108','2025-08-12 08:41:14.225111');
INSERT INTO "email_folders" VALUES('9eec5c18-a7ec-45c0-ba91-5b50b70f7dbc','2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','trash','#6b7280',1,'2025-08-12 08:41:14.225261','2025-08-12 08:41:14.225266');
INSERT INTO "email_folders" VALUES('a2218279-9e2c-4336-9e59-2284b95ab98b','2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','starred','#eab308',1,'2025-08-12 08:41:14.225384','2025-08-12 08:41:14.225389');
CREATE TABLE email_logs (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36), 
	recipient_email VARCHAR(255) NOT NULL, 
	subject VARCHAR(255) NOT NULL, 
	template_name VARCHAR(100), 
	status VARCHAR(50) NOT NULL, 
	error_message TEXT, 
	sent_at DATETIME, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "email_logs" VALUES(1,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Your Remote Career Journey Starts Here!','manual_test','sent',NULL,'2025-08-10 08:47:01.768214','2025-08-10 08:47:01');
INSERT INTO "email_logs" VALUES(2,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Your Remote Career Journey Starts Here!','manual_test','sent',NULL,'2025-08-10 08:59:59.268247','2025-08-10 08:59:59');
INSERT INTO "email_logs" VALUES(3,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Test Email','manual_test','sent',NULL,'2025-08-11 05:02:23.688074','2025-08-11 05:02:23');
INSERT INTO "email_logs" VALUES(4,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Test Email','manual_test','sent',NULL,'2025-08-11 05:04:22.118136','2025-08-11 05:04:22');
INSERT INTO "email_logs" VALUES(5,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Test Email','manual_test','sent',NULL,'2025-08-11 05:06:53.289997','2025-08-11 05:06:53');
INSERT INTO "email_logs" VALUES(6,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Test Email','manual_test','sent',NULL,'2025-08-11 05:08:52.670992','2025-08-11 05:08:52');
INSERT INTO "email_logs" VALUES(7,NULL,'ranjeettiwary589@gmail.com','Welcome to RemoteHive - Test Email','manual_test','sent',NULL,'2025-08-11 05:10:00.430765','2025-08-11 05:10:00');
INSERT INTO "email_logs" VALUES(8,NULL,'ranjeettiwary589@gmail.com','Direct Test Email','manual_test','sent',NULL,'2025-08-11 05:13:32.484055','2025-08-11 05:13:32');
CREATE TABLE email_message_folders (
	id VARCHAR(36) NOT NULL, 
	message_id VARCHAR(36) NOT NULL, 
	folder_id VARCHAR(36) NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(message_id) REFERENCES email_messages (id), 
	FOREIGN KEY(folder_id) REFERENCES email_folders (id)
);
CREATE TABLE email_messages (
	id VARCHAR(36) NOT NULL, 
	from_email VARCHAR(255) NOT NULL, 
	to_email VARCHAR(255) NOT NULL, 
	cc_email TEXT, 
	bcc_email TEXT, 
	reply_to VARCHAR(255), 
	subject VARCHAR(500) NOT NULL, 
	content TEXT NOT NULL, 
	html_content TEXT, 
	priority VARCHAR(6), 
	status VARCHAR(9) NOT NULL, 
	message_id VARCHAR(255), 
	thread_id VARCHAR(255), 
	is_starred BOOLEAN, 
	is_archived BOOLEAN, 
	is_spam BOOLEAN, 
	is_draft BOOLEAN, 
	is_read BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME, 
	sent_at DATETIME, 
	delivered_at DATETIME, 
	read_at DATETIME, 
	error_message TEXT, 
	retry_count INTEGER, 
	from_user_id VARCHAR(36), 
	to_user_id VARCHAR(36), 
	created_by VARCHAR(36), 
	updated_by VARCHAR(36), 
	PRIMARY KEY (id), 
	FOREIGN KEY(from_user_id) REFERENCES email_users (id), 
	FOREIGN KEY(to_user_id) REFERENCES email_users (id), 
	FOREIGN KEY(created_by) REFERENCES users (id), 
	FOREIGN KEY(updated_by) REFERENCES users (id)
);
CREATE TABLE email_signatures (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	content TEXT NOT NULL, 
	html_content TEXT, 
	is_default BOOLEAN, 
	is_active BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES email_users (id)
);
CREATE TABLE email_templates (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	subject VARCHAR(255) NOT NULL, 
	html_content TEXT NOT NULL, 
	text_content TEXT, 
	template_type VARCHAR(50) NOT NULL, 
	is_active BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), category VARCHAR(50) DEFAULT 'general' NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
INSERT INTO "email_templates" VALUES(1,'welcome_email','Welcome to RemoteHive!','<html>
<body>
    <h1>Welcome to RemoteHive!</h1>
    <p>Dear {{user_name}},</p>
    <p>Thank you for joining our platform. Start exploring remote opportunities today!</p>
    <p>Best regards,<br>The RemoteHive Team</p>
</body>
</html>','Welcome to RemoteHive! Dear {{user_name}}, Thank you for joining our platform. Start exploring remote opportunities today! Best regards, The RemoteHive Team','welcome',1,'2025-08-09 14:01:30','2025-08-11 04:50:13.019666','onboarding');
INSERT INTO "email_templates" VALUES(2,'job_alert','New Jobs Matching Your Preferences','<html>
<body>
    <h1>New Job Opportunities</h1>
    <p>Hi {{user_name}},</p>
    <p>We found {{job_count}} new jobs that match your preferences:</p>
    <ul>
    {% for job in jobs %}
        <li><strong>{{job.title}}</strong> at {{job.company}} - {{job.location}}</li>
    {% endfor %}
    </ul>
    <p><a href="{{base_url}}/jobs">View All Jobs</a></p>
</body>
</html>','Hi {{user_name}}, We found {{job_count}} new jobs that match your preferences. Visit {{base_url}}/jobs to view them.','notification',1,'2025-08-09 14:01:30','2025-08-09 14:01:30','notification');
INSERT INTO "email_templates" VALUES(3,'email_verification','Verify Your Email Address','<html>
<body>
    <h1>Email Verification</h1>
    <p>Hi {{user_name}},</p>
    <p>Please click the link below to verify your email address:</p>
    <p><a href="{{verification_url}}">Verify Email</a></p>
    <p>If you didn''t create an account, please ignore this email.</p>
</body>
</html>','Hi {{user_name}}, Please visit {{verification_url}} to verify your email address. If you didn''t create an account, please ignore this email.','verification',1,'2025-08-09 14:01:30','2025-08-09 14:01:30','verification');
INSERT INTO "email_templates" VALUES(4,'application_status','Application Status Update','<html>
<body>
    <h1>Application Status Update</h1>
    <p>Hi {{user_name}},</p>
    <p>Your application for <strong>{{job_title}}</strong> at {{company_name}} has been {{status}}.</p>
    {% if status == ''accepted'' %}
    <p>Congratulations! The employer will contact you soon.</p>
    {% elif status == ''rejected'' %}
    <p>Thank you for your interest. Keep applying to other opportunities!</p>
    {% endif %}
    <p><a href="{{base_url}}/applications">View Your Applications</a></p>
</body>
</html>','Hi {{user_name}}, Your application for {{job_title}} at {{company_name}} has been {{status}}. Visit {{base_url}}/applications to view your applications.','notification',1,'2025-08-09 14:01:30','2025-08-09 14:01:30','notification');
INSERT INTO "email_templates" VALUES(5,'support_request','Support Request Received','<html>
<body>
    <h1>Support Request Received</h1>
    <p>Hi {{user_name}},</p>
    <p>We''ve received your support request and will get back to you within 24 hours.</p>
    <p><strong>Request Details:</strong></p>
    <p>Subject: {{request_subject}}</p>
    <p>Message: {{request_message}}</p>
    <p>Reference ID: {{ticket_id}}</p>
</body>
</html>','Hi {{user_name}}, We''ve received your support request and will get back to you within 24 hours. Reference ID: {{ticket_id}}','support_request',1,'2025-08-09 14:01:30','2025-08-11 05:17:06.879889','support');
CREATE TABLE email_users (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	first_name VARCHAR(100) NOT NULL, 
	last_name VARCHAR(100) NOT NULL, 
	personal_email VARCHAR(255), 
	role VARCHAR(11) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_verified BOOLEAN NOT NULL, 
	is_locked BOOLEAN NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME, 
	last_login DATETIME, 
	password_reset_at DATETIME, 
	deleted_at DATETIME, 
	created_by VARCHAR(36), 
	updated_by VARCHAR(36), 
	password_reset_by VARCHAR(36), 
	deleted_by VARCHAR(36), 
	failed_login_attempts INTEGER, 
	last_failed_login DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id), 
	FOREIGN KEY(updated_by) REFERENCES users (id), 
	FOREIGN KEY(password_reset_by) REFERENCES users (id), 
	FOREIGN KEY(deleted_by) REFERENCES users (id)
);
INSERT INTO "email_users" VALUES('2a8bd151-6f81-4b0b-a9dc-f5813d4e0285','admin@remotehive.in','RemoteHive','Admin','admin@remotehive.in','ADMIN','$2b$12$dummy_hash_for_admin',1,1,0,'2025-08-12 08:41:14.216843','2025-08-12 09:05:54.022717',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924',NULL,NULL,0,NULL);
CREATE TABLE email_verification_tokens (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	token VARCHAR(255) NOT NULL, 
	expires_at DATETIME NOT NULL, 
	is_used BOOLEAN, 
	used_at DATETIME, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	UNIQUE (token)
);
INSERT INTO "email_verification_tokens" VALUES(1,'967a82e2-83ba-4267-952c-361eef927bfc','0e3f95e5-6850-4d03-b52a-4f9009dc4ed8','2025-08-11 22:11:33.870557',0,NULL,'2025-08-11 21:11:33');
INSERT INTO "email_verification_tokens" VALUES(2,'ebcb22ba-4404-4b8a-833e-714168e7d91f','29a97ee1-a7f5-4d53-bdb4-ca3f03696266','2025-08-11 22:17:21.340782',0,NULL,'2025-08-11 21:17:21');
INSERT INTO "email_verification_tokens" VALUES(3,'1469e4db-899e-497c-813a-5be73a8b4c1a','fc1516ae-9797-4885-a2fd-f48cd4cb8aff','2025-08-12 06:09:26.685032',0,NULL,'2025-08-12 05:09:26');
CREATE TABLE employers (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	employer_number VARCHAR(20), 
	company_name VARCHAR(255) NOT NULL, 
	company_email VARCHAR(255) NOT NULL, 
	company_phone VARCHAR(20), 
	company_website VARCHAR(255), 
	company_description TEXT, 
	company_logo VARCHAR(500), 
	industry VARCHAR(100), 
	company_size VARCHAR(50), 
	location VARCHAR(255), 
	is_verified BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (employer_number), 
	UNIQUE (company_email)
);
INSERT INTO "employers" VALUES('fad1476f-eb8f-42ad-a5a6-b76a176c3ef6','37251a0c-56cd-4a0c-9c0d-1f897c0d0c57','RH0001','facebook','contact@facebook.com',NULL,NULL,NULL,NULL,NULL,NULL,'india',0,'2025-08-05 06:07:38','2025-08-05 06:07:38');
INSERT INTO "employers" VALUES('c443326f-7499-4e10-bf59-81453d253aef','37251a0c-56cd-4a0c-9c0d-1f897c0d0c57',NULL,'Google test','contact@google.com',NULL,'google.com',NULL,NULL,'Technology','11-50 employees','india',0,'2025-08-06 09:47:32','2025-08-06 09:47:32');
INSERT INTO "employers" VALUES('72add8e4-a70a-4572-a237-4ebab5b9ac5d','a16eeb22-fa42-4d0b-8d41-aff0b73e0d38',NULL,'Unique Test Company','uniquetest@example.com',NULL,NULL,'Test employer profile',NULL,'Technology','startup','Remote',0,'2025-08-06 10:24:05','2025-08-06 10:24:05');
INSERT INTO "employers" VALUES('561a386f-eb8c-40cc-872d-0b0177ec0705','82e2c206-efd7-4443-a3f5-a09289c8f715',NULL,'Debug Test Company','debugtest@example.com',NULL,NULL,'New employer profile',NULL,'Not specified','startup','Not specified',0,'2025-08-06 10:29:12','2025-08-06 10:29:12');
INSERT INTO "employers" VALUES('f30df766-de66-4101-91de-169e8a59c05d','4d3a3eef-17fa-4557-b539-8e25b20d5a2d',NULL,'Endpoint Test Company','endpointtest@example.com',NULL,NULL,'New employer profile',NULL,'Not specified','startup','Not specified',0,'2025-08-06 10:31:44','2025-08-06 10:31:44');
INSERT INTO "employers" VALUES('60fa28ff-11b2-4b81-a58a-d68e1b2ae273','b616fd53-b775-4784-8436-6a33302b4bdb',NULL,'Ranjeet Tiwary Company','ranjeet@gmail.com',NULL,NULL,'New employer profile',NULL,'Not specified','startup','Not specified',0,'2025-08-06 16:34:02','2025-08-06 16:34:02');
INSERT INTO "employers" VALUES('b960c734-eef5-41cb-8a9c-46fcbb2aca53','93d0acb9-1559-42fc-95d3-bed8b80a0c6f',NULL,'Test Company','test.employer2@example.com',NULL,NULL,'New employer profile',NULL,'Technology','10-50',NULL,0,'2025-08-07 12:14:19','2025-08-07 12:14:19');
INSERT INTO "employers" VALUES('bd124acc-ae94-4e5a-98bb-f44f1084b955','1469e4db-899e-497c-813a-5be73a8b4c1a',NULL,'New Employer Company','newemployer@demo.com',NULL,NULL,'New employer profile',NULL,'Not specified','startup','Not specified',0,'2025-08-12 05:09:18','2025-08-12 05:09:18');
CREATE TABLE interviews (
	id VARCHAR(36) NOT NULL, 
	job_application_id VARCHAR(36) NOT NULL, 
	interviewer_id VARCHAR(36) NOT NULL, 
	candidate_id VARCHAR(36) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT, 
	scheduled_date DATETIME NOT NULL, 
	duration_minutes INTEGER, 
	interview_type VARCHAR(50), 
	meeting_link VARCHAR(500), 
	location VARCHAR(255), 
	status VARCHAR(50), 
	feedback TEXT, 
	rating INTEGER, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(candidate_id) REFERENCES users (id), 
	FOREIGN KEY(interviewer_id) REFERENCES users (id), 
	FOREIGN KEY(job_application_id) REFERENCES job_applications (id) ON DELETE CASCADE
);
CREATE TABLE job_applications (
	id VARCHAR(36) NOT NULL, 
	job_post_id VARCHAR(36) NOT NULL, 
	job_seeker_id INTEGER NOT NULL, 
	cover_letter TEXT, 
	resume_url VARCHAR(500), 
	portfolio_url VARCHAR(500), 
	expected_salary INTEGER, 
	salary_currency VARCHAR(10), 
	available_start_date DATETIME, 
	applicant_email VARCHAR(255), 
	applicant_phone VARCHAR(50), 
	status VARCHAR(50), 
	notes TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(job_post_id) REFERENCES job_posts (id), 
	FOREIGN KEY(job_seeker_id) REFERENCES job_seekers (id)
);
CREATE TABLE job_categories (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	description TEXT, 
	icon VARCHAR(100), 
	color VARCHAR(20), 
	is_active BOOLEAN, 
	sort_order INTEGER, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	UNIQUE (name), 
	UNIQUE (slug)
);
INSERT INTO "job_categories" VALUES(1,'Software Development','software-development','Programming, software engineering, and development roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(2,'Data Science','data-science','Data analysis, machine learning, and data engineering roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(3,'Design','design','UI/UX design, graphic design, and creative roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(4,'Marketing','marketing','Digital marketing, content marketing, and growth roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(5,'Sales','sales','Sales representatives, account managers, and business development',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(6,'Customer Support','customer-support','Customer service, technical support, and success roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(7,'Product Management','product-management','Product managers, product owners, and strategy roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(8,'Operations','operations','Operations, logistics, and administrative roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(9,'Finance','finance','Accounting, finance, and business analysis roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(10,'Human Resources','human-resources','HR, recruiting, and people operations roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(11,'DevOps','devops','Infrastructure, cloud, and deployment roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
INSERT INTO "job_categories" VALUES(12,'Quality Assurance','quality-assurance','Testing, QA, and quality control roles',NULL,NULL,1,0,'2025-08-05 06:05:40');
CREATE TABLE job_posts (
	id VARCHAR(36) NOT NULL, 
	employer_id VARCHAR(36) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	requirements TEXT, 
	responsibilities TEXT, 
	benefits TEXT, 
	job_type VARCHAR(50) NOT NULL, 
	work_location VARCHAR(50) NOT NULL, 
	salary_min INTEGER, 
	salary_max INTEGER, 
	salary_currency VARCHAR(10), 
	experience_level VARCHAR(50), 
	education_level VARCHAR(100), 
	skills_required JSON, 
	application_deadline DATETIME, 
	is_remote BOOLEAN, 
	location_city VARCHAR(100), 
	location_state VARCHAR(100), 
	location_country VARCHAR(100), 
	status VARCHAR(50), 
	priority VARCHAR(20), 
	workflow_stage VARCHAR(50), 
	employer_number VARCHAR(20), 
	auto_publish BOOLEAN, 
	scheduled_publish_date DATETIME, 
	expiry_date DATETIME, 
	last_workflow_action VARCHAR(50), 
	workflow_notes TEXT, 
	admin_priority INTEGER, 
	requires_review BOOLEAN, 
	review_completed_at DATETIME, 
	review_completed_by VARCHAR(36), 
	submitted_for_approval_at DATETIME, 
	submitted_by VARCHAR(36), 
	approved_at DATETIME, 
	approved_by VARCHAR(36), 
	rejected_at DATETIME, 
	rejected_by VARCHAR(36), 
	rejection_reason VARCHAR(100), 
	rejection_notes TEXT, 
	published_at DATETIME, 
	published_by VARCHAR(36), 
	unpublished_at DATETIME, 
	unpublished_by VARCHAR(36), 
	unpublish_reason TEXT, 
	is_featured BOOLEAN, 
	is_urgent BOOLEAN, 
	is_flagged BOOLEAN, 
	flagged_at DATETIME, 
	flagged_by VARCHAR(36), 
	flagged_reason TEXT, 
	views_count INTEGER, 
	applications_count INTEGER, 
	external_apply_url VARCHAR(500), 
	external_id VARCHAR(255), 
	external_source VARCHAR(100), 
	company_name VARCHAR(255), 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(employer_id) REFERENCES employers (id), 
	FOREIGN KEY(review_completed_by) REFERENCES users (id), 
	FOREIGN KEY(submitted_by) REFERENCES users (id), 
	FOREIGN KEY(approved_by) REFERENCES users (id), 
	FOREIGN KEY(rejected_by) REFERENCES users (id), 
	FOREIGN KEY(published_by) REFERENCES users (id), 
	FOREIGN KEY(unpublished_by) REFERENCES users (id), 
	FOREIGN KEY(flagged_by) REFERENCES users (id)
);
INSERT INTO "job_posts" VALUES('551ddefb-ac57-4da3-9c0c-8960f6a652df','fad1476f-eb8f-42ad-a5a6-b76a176c3ef6','software developer','guiguhiohiuhguiioyituhoiyugiuiutuyfuyitruiyiotyufuyuifytfyufytguiguytui','vhjvhvvhjvjvhjhgjhhjggjkgjghjghjghjghfhjfhjfhjfhjfhjf','jkljojhigbhuiyuihuitgkhoiugjguigyukfgyiugtgi','fgiffgktuyruyoituruiyiou6rytuyiryeytryug','full_time','remote',50000,80000,'USD','entry',NULL,'[]',NULL,1,NULL,NULL,NULL,'approved','normal','draft',NULL,0,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,'2025-08-05 11:57:17.952965','4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'facebook','2025-08-05 11:57:17','2025-08-05 11:57:17');
INSERT INTO "job_posts" VALUES('aef1f463-b857-4592-b34a-cded5c1b1cd9','fad1476f-eb8f-42ad-a5a6-b76a176c3ef6','software developer','efhwioehioihfihieghfioeroiyhfguihrfheiurgfuihweruihfuiehfuihruiefhfjioherfuigfriueriu','hfiurhfuirehfuyugfuyeryfugrfyyeufygeryufyer','rfhuirhf87guihfuigrf8guireu','gruiewguiefgugfygeuirfgiergfugiuergfuigrei','full_time','remote',50000,80000,'USD','mid',NULL,'[]',NULL,1,NULL,NULL,NULL,'approved','normal','draft',NULL,1,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,'2025-08-05 14:13:33.802220','4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'facebook','2025-08-05 14:13:33','2025-08-05 14:13:33');
INSERT INTO "job_posts" VALUES('c4410dfd-6b2c-49de-b5ef-d5dacc134ea6','fad1476f-eb8f-42ad-a5a6-b76a176c3ef6','software developer','efhwioehioihfihieghfioeroiyhfguihrfheiurgfuihweruihfuiehfuihruiefhfjioherfuigfriueriu','hfiurhfuirehfuyugfuyeryfugrfyyeufygeryufyer','rfhuirhf87guihfuigrf8guireu','gruiewguiefgugfygeuirfgiergfugiuergfuigrei','full_time','remote',50000,80000,'USD','mid',NULL,'[]',NULL,1,NULL,NULL,NULL,'approved','normal','draft',NULL,1,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,'2025-08-05 14:13:38.062175','4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'facebook','2025-08-05 14:13:38','2025-08-05 14:13:38');
INSERT INTO "job_posts" VALUES('de4cbc5f-4912-4df5-8280-c0ed3d59a8f8','fad1476f-eb8f-42ad-a5a6-b76a176c3ef6','software developer','efhwioehioihfihieghfioeroiyhfguihrfheiurgfuihweruihfuiehfuihruiefhfjioherfuigfriueriu','hfiurhfuirehfuyugfuyeryfugrfyyeufygeryufyer','rfhuirhf87guihfuigrf8guireu','gruiewguiefgugfygeuirfgiergfugiuergfuigrei','full_time','remote',50000,80000,'USD','mid',NULL,'[]',NULL,1,NULL,NULL,NULL,'approved','normal','draft',NULL,1,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,'2025-08-05 14:13:39.301883','4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'facebook','2025-08-05 14:13:39','2025-08-05 14:13:39');
CREATE TABLE job_seekers (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	current_title VARCHAR(255), 
	experience_level VARCHAR(50), 
	years_of_experience INTEGER, 
	skills TEXT, 
	preferred_job_types TEXT, 
	preferred_locations TEXT, 
	remote_work_preference BOOLEAN, 
	min_salary INTEGER, 
	max_salary INTEGER, 
	salary_currency VARCHAR(10), 
	resume_url VARCHAR(500), 
	portfolio_url VARCHAR(500), 
	cover_letter_template TEXT, 
	is_actively_looking BOOLEAN, 
	education_level VARCHAR(100), 
	field_of_study VARCHAR(100), 
	university VARCHAR(255), 
	graduation_year INTEGER, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "job_seekers" VALUES(1,'e547bb3e-5f25-43c4-be36-38eab8459a5c','Test Job Seeker','entry',NULL,'["Python", "JavaScript"]','["full_time"]','["Remote"]',0,NULL,NULL,'USD',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'2025-08-06 10:38:20','2025-08-06 10:38:20');
INSERT INTO "job_seekers" VALUES(2,'dc8d7f97-6dd2-4f37-99b0-21476bf33156','Job Seeker','entry',NULL,'[]','["full_time"]','["Remote"]',0,NULL,NULL,'USD',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'2025-08-07 04:41:57','2025-08-07 04:41:57');
INSERT INTO "job_seekers" VALUES(3,'3a0438d9-afb0-49fd-b568-facfb018e5b7','Job Seeker','mid',NULL,'["Python", "JavaScript", "React"]',NULL,NULL,0,NULL,NULL,'USD',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'2025-08-07 12:14:33','2025-08-07 12:14:33');
INSERT INTO "job_seekers" VALUES(4,'967a82e2-83ba-4267-952c-361eef927bfc','Job Seeker','entry',NULL,'[]','["full_time"]','["Remote"]',0,NULL,NULL,'USD',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'2025-08-11 21:11:25','2025-08-11 21:11:25');
INSERT INTO "job_seekers" VALUES(5,'ebcb22ba-4404-4b8a-833e-714168e7d91f','Job Seeker','entry',NULL,'[]','["full_time"]','["Remote"]',0,NULL,NULL,'USD',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'2025-08-11 21:17:13','2025-08-11 21:17:13');
CREATE TABLE job_workflow_logs (
	id INTEGER NOT NULL, 
	job_post_id VARCHAR(36) NOT NULL, 
	action VARCHAR(50) NOT NULL, 
	from_status VARCHAR(50), 
	to_status VARCHAR(50), 
	performed_by VARCHAR(36) NOT NULL, 
	reason TEXT, 
	notes TEXT, 
	additional_data JSON, 
	ip_address VARCHAR(45), 
	user_agent TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(job_post_id) REFERENCES job_posts (id), 
	FOREIGN KEY(performed_by) REFERENCES users (id)
);
CREATE TABLE login_attempts (
	id INTEGER NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	ip_address VARCHAR(45), 
	user_agent VARCHAR(500), 
	success BOOLEAN, 
	failure_reason VARCHAR(100), 
	attempted_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id)
);
INSERT INTO "login_attempts" VALUES(1,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-07 11:25:54');
INSERT INTO "login_attempts" VALUES(2,'ranjeettiwari105@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-07 11:26:34');
INSERT INTO "login_attempts" VALUES(3,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-07 11:26:56');
INSERT INTO "login_attempts" VALUES(4,'ranjeettiwary589@gmail.com','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-08 06:03:38');
INSERT INTO "login_attempts" VALUES(5,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-08 06:05:47');
INSERT INTO "login_attempts" VALUES(6,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-08 06:11:10');
INSERT INTO "login_attempts" VALUES(7,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-08 06:14:27');
INSERT INTO "login_attempts" VALUES(8,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-08 06:18:26');
INSERT INTO "login_attempts" VALUES(9,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-08 06:19:22');
INSERT INTO "login_attempts" VALUES(10,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-08 06:22:46');
INSERT INTO "login_attempts" VALUES(11,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-08 09:58:32');
INSERT INTO "login_attempts" VALUES(12,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-08 09:58:51');
INSERT INTO "login_attempts" VALUES(13,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-09 09:49:52');
INSERT INTO "login_attempts" VALUES(14,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-09 10:30:16');
INSERT INTO "login_attempts" VALUES(15,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-09 13:06:46');
INSERT INTO "login_attempts" VALUES(16,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-09 13:39:25');
INSERT INTO "login_attempts" VALUES(17,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-09 13:39:51');
INSERT INTO "login_attempts" VALUES(18,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 13:47:31');
INSERT INTO "login_attempts" VALUES(19,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 13:51:11');
INSERT INTO "login_attempts" VALUES(20,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:00:34');
INSERT INTO "login_attempts" VALUES(21,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:01:46');
INSERT INTO "login_attempts" VALUES(22,'admin@remotehive.com','127.0.0.1','python-requests/2.31.0',0,'Invalid admin credentials','2025-08-09 14:13:14');
INSERT INTO "login_attempts" VALUES(23,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:14:03');
INSERT INTO "login_attempts" VALUES(24,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:15:31');
INSERT INTO "login_attempts" VALUES(25,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:21:40');
INSERT INTO "login_attempts" VALUES(26,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:22:32');
INSERT INTO "login_attempts" VALUES(27,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:23:23');
INSERT INTO "login_attempts" VALUES(28,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:25:21');
INSERT INTO "login_attempts" VALUES(29,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:27:18');
INSERT INTO "login_attempts" VALUES(30,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:28:55');
INSERT INTO "login_attempts" VALUES(31,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:32:08');
INSERT INTO "login_attempts" VALUES(32,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:39:36');
INSERT INTO "login_attempts" VALUES(33,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:41:00');
INSERT INTO "login_attempts" VALUES(34,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:42:09');
INSERT INTO "login_attempts" VALUES(35,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 14:53:30');
INSERT INTO "login_attempts" VALUES(36,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:04:44');
INSERT INTO "login_attempts" VALUES(37,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:05:29');
INSERT INTO "login_attempts" VALUES(38,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:06:30');
INSERT INTO "login_attempts" VALUES(39,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:08:19');
INSERT INTO "login_attempts" VALUES(40,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:13:00');
INSERT INTO "login_attempts" VALUES(41,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:13:04');
INSERT INTO "login_attempts" VALUES(42,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:14:09');
INSERT INTO "login_attempts" VALUES(43,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:21:25');
INSERT INTO "login_attempts" VALUES(44,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:22:53');
INSERT INTO "login_attempts" VALUES(45,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:23:37');
INSERT INTO "login_attempts" VALUES(46,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:26:19');
INSERT INTO "login_attempts" VALUES(47,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:43:44');
INSERT INTO "login_attempts" VALUES(48,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 15:44:39');
INSERT INTO "login_attempts" VALUES(49,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 16:06:21');
INSERT INTO "login_attempts" VALUES(50,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 16:12:34');
INSERT INTO "login_attempts" VALUES(51,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 16:16:16');
INSERT INTO "login_attempts" VALUES(52,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-09 16:21:35');
INSERT INTO "login_attempts" VALUES(53,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-09 18:21:46');
INSERT INTO "login_attempts" VALUES(54,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-10 08:35:01');
INSERT INTO "login_attempts" VALUES(55,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:46:57');
INSERT INTO "login_attempts" VALUES(56,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:47:15');
INSERT INTO "login_attempts" VALUES(57,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:48:22');
INSERT INTO "login_attempts" VALUES(58,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:55:14');
INSERT INTO "login_attempts" VALUES(59,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:55:46');
INSERT INTO "login_attempts" VALUES(60,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',0,'Invalid admin credentials','2025-08-10 08:58:37');
INSERT INTO "login_attempts" VALUES(61,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:59:04');
INSERT INTO "login_attempts" VALUES(62,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-10 08:59:53');
INSERT INTO "login_attempts" VALUES(63,'admin@remotehive.in','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',0,'Invalid role for public login','2025-08-10 10:36:54');
INSERT INTO "login_attempts" VALUES(64,'admin@remotehive.in','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',1,NULL,'2025-08-10 10:37:13');
INSERT INTO "login_attempts" VALUES(65,'admin@remotehive.in','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',1,NULL,'2025-08-10 10:38:17');
INSERT INTO "login_attempts" VALUES(66,'admin@remotehive.in','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',1,NULL,'2025-08-10 10:39:59');
INSERT INTO "login_attempts" VALUES(67,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-10 13:10:12');
INSERT INTO "login_attempts" VALUES(68,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-10 13:10:27');
INSERT INTO "login_attempts" VALUES(69,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-10 13:10:50');
INSERT INTO "login_attempts" VALUES(70,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-10 18:45:31');
INSERT INTO "login_attempts" VALUES(71,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-10 18:50:50');
INSERT INTO "login_attempts" VALUES(72,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-11 04:45:31');
INSERT INTO "login_attempts" VALUES(73,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-11 04:49:51');
INSERT INTO "login_attempts" VALUES(74,'admin@remotehive.com','127.0.0.1','python-requests/2.31.0',0,'Invalid admin credentials','2025-08-11 04:58:45');
INSERT INTO "login_attempts" VALUES(75,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',0,'Invalid admin credentials','2025-08-11 04:59:57');
INSERT INTO "login_attempts" VALUES(76,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:00:31');
INSERT INTO "login_attempts" VALUES(77,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:02:16');
INSERT INTO "login_attempts" VALUES(78,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:04:14');
INSERT INTO "login_attempts" VALUES(79,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:06:46');
INSERT INTO "login_attempts" VALUES(80,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:08:45');
INSERT INTO "login_attempts" VALUES(81,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:09:53');
INSERT INTO "login_attempts" VALUES(82,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:12:34');
INSERT INTO "login_attempts" VALUES(83,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 05:13:24');
INSERT INTO "login_attempts" VALUES(84,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-11 06:00:44');
INSERT INTO "login_attempts" VALUES(85,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-11 06:20:20');
INSERT INTO "login_attempts" VALUES(86,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-11 11:37:18');
INSERT INTO "login_attempts" VALUES(87,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 11:43:25');
INSERT INTO "login_attempts" VALUES(88,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-11 12:03:36');
INSERT INTO "login_attempts" VALUES(89,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-11 18:37:33');
INSERT INTO "login_attempts" VALUES(90,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-11 18:38:32');
INSERT INTO "login_attempts" VALUES(91,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-11 21:09:56');
INSERT INTO "login_attempts" VALUES(92,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-11 21:09:57');
INSERT INTO "login_attempts" VALUES(93,'jobseeker@demo.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid credentials','2025-08-11 21:10:17');
INSERT INTO "login_attempts" VALUES(94,'jobseeker@demo.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid credentials','2025-08-11 21:10:19');
INSERT INTO "login_attempts" VALUES(95,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-11 21:13:53');
INSERT INTO "login_attempts" VALUES(96,'ranjeettiwari105@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-11 21:14:07');
INSERT INTO "login_attempts" VALUES(97,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-11 21:15:05');
INSERT INTO "login_attempts" VALUES(98,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-11 21:15:30');
INSERT INTO "login_attempts" VALUES(99,'testjobseeker@demo.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-11 21:17:25');
INSERT INTO "login_attempts" VALUES(100,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:09:50');
INSERT INTO "login_attempts" VALUES(101,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:09:58');
INSERT INTO "login_attempts" VALUES(102,'ranjeettiwari105@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:10:04');
INSERT INTO "login_attempts" VALUES(103,'ranjeettiwari105@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:10:10');
INSERT INTO "login_attempts" VALUES(104,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:11:06');
INSERT INTO "login_attempts" VALUES(105,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:11:16');
INSERT INTO "login_attempts" VALUES(106,'ranjeettiwary589@gmail.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-12 05:11:18');
INSERT INTO "login_attempts" VALUES(107,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-12 05:31:30');
INSERT INTO "login_attempts" VALUES(108,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-12 08:27:39');
INSERT INTO "login_attempts" VALUES(109,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-12 08:34:50');
INSERT INTO "login_attempts" VALUES(110,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-13 10:23:44');
INSERT INTO "login_attempts" VALUES(111,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-13 15:18:12');
INSERT INTO "login_attempts" VALUES(112,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-16 12:29:02');
INSERT INTO "login_attempts" VALUES(113,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-16 14:47:32');
INSERT INTO "login_attempts" VALUES(114,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-16 15:26:15');
INSERT INTO "login_attempts" VALUES(115,'min@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',0,'Invalid admin credentials','2025-08-16 15:59:38');
INSERT INTO "login_attempts" VALUES(116,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-16 15:59:47');
INSERT INTO "login_attempts" VALUES(117,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-16 18:09:16');
INSERT INTO "login_attempts" VALUES(118,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-16 18:40:58');
INSERT INTO "login_attempts" VALUES(119,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-16 19:54:27');
INSERT INTO "login_attempts" VALUES(120,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-16 20:12:22');
INSERT INTO "login_attempts" VALUES(121,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 04:43:29');
INSERT INTO "login_attempts" VALUES(122,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 04:48:35');
INSERT INTO "login_attempts" VALUES(123,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-17 04:54:01');
INSERT INTO "login_attempts" VALUES(124,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-17 05:29:35');
INSERT INTO "login_attempts" VALUES(125,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-17 05:29:37');
INSERT INTO "login_attempts" VALUES(126,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 12:04:23');
INSERT INTO "login_attempts" VALUES(127,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-17 12:24:03');
INSERT INTO "login_attempts" VALUES(128,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-17 12:25:09');
INSERT INTO "login_attempts" VALUES(129,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 12:36:00');
INSERT INTO "login_attempts" VALUES(130,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 12:40:46');
INSERT INTO "login_attempts" VALUES(131,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 12:41:16');
INSERT INTO "login_attempts" VALUES(132,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 12:45:11');
INSERT INTO "login_attempts" VALUES(133,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 12:46:20');
INSERT INTO "login_attempts" VALUES(134,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 12:53:25');
INSERT INTO "login_attempts" VALUES(135,'admin@remotehive.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 12:56:18');
INSERT INTO "login_attempts" VALUES(136,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 12:56:46');
INSERT INTO "login_attempts" VALUES(137,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 13:00:41');
INSERT INTO "login_attempts" VALUES(138,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 13:03:00');
INSERT INTO "login_attempts" VALUES(139,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 13:03:55');
INSERT INTO "login_attempts" VALUES(140,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 13:04:33');
INSERT INTO "login_attempts" VALUES(141,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 13:06:08');
INSERT INTO "login_attempts" VALUES(142,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 13:09:11');
INSERT INTO "login_attempts" VALUES(143,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 13:09:58');
INSERT INTO "login_attempts" VALUES(144,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 13:40:11');
INSERT INTO "login_attempts" VALUES(145,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 13:40:29');
INSERT INTO "login_attempts" VALUES(146,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Invalid admin credentials','2025-08-17 13:41:28');
INSERT INTO "login_attempts" VALUES(147,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Admin rate limit exceeded','2025-08-17 13:41:57');
INSERT INTO "login_attempts" VALUES(148,'admin@example.com','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',0,'Admin rate limit exceeded','2025-08-17 13:42:16');
INSERT INTO "login_attempts" VALUES(149,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 14:13:15');
INSERT INTO "login_attempts" VALUES(150,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 14:13:41');
INSERT INTO "login_attempts" VALUES(151,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 14:15:11');
INSERT INTO "login_attempts" VALUES(152,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 19:09:50');
INSERT INTO "login_attempts" VALUES(153,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 19:10:51');
INSERT INTO "login_attempts" VALUES(154,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 19:21:10');
INSERT INTO "login_attempts" VALUES(155,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 19:29:12');
INSERT INTO "login_attempts" VALUES(156,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 19:31:24');
INSERT INTO "login_attempts" VALUES(157,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 19:46:00');
INSERT INTO "login_attempts" VALUES(158,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 19:48:41');
INSERT INTO "login_attempts" VALUES(159,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,NULL,'2025-08-17 19:51:55');
INSERT INTO "login_attempts" VALUES(160,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 20:11:38');
INSERT INTO "login_attempts" VALUES(161,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 20:26:14');
INSERT INTO "login_attempts" VALUES(162,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 20:26:30');
INSERT INTO "login_attempts" VALUES(163,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 20:26:48');
INSERT INTO "login_attempts" VALUES(164,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-17 20:27:06');
INSERT INTO "login_attempts" VALUES(165,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-18 06:59:25');
INSERT INTO "login_attempts" VALUES(166,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:04:47');
INSERT INTO "login_attempts" VALUES(167,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:05:57');
INSERT INTO "login_attempts" VALUES(168,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:08:54');
INSERT INTO "login_attempts" VALUES(169,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:09:19');
INSERT INTO "login_attempts" VALUES(170,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:12:46');
INSERT INTO "login_attempts" VALUES(171,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:13:10');
INSERT INTO "login_attempts" VALUES(172,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:14:06');
INSERT INTO "login_attempts" VALUES(173,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:16:37');
INSERT INTO "login_attempts" VALUES(174,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:18:05');
INSERT INTO "login_attempts" VALUES(175,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:21:05');
INSERT INTO "login_attempts" VALUES(176,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:22:12');
INSERT INTO "login_attempts" VALUES(177,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:22:52');
INSERT INTO "login_attempts" VALUES(178,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:24:13');
INSERT INTO "login_attempts" VALUES(179,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:25:00');
INSERT INTO "login_attempts" VALUES(180,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:25:41');
INSERT INTO "login_attempts" VALUES(181,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:26:11');
INSERT INTO "login_attempts" VALUES(182,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:27:00');
INSERT INTO "login_attempts" VALUES(183,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:31:14');
INSERT INTO "login_attempts" VALUES(184,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:32:30');
INSERT INTO "login_attempts" VALUES(185,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:33:52');
INSERT INTO "login_attempts" VALUES(186,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 07:36:10');
INSERT INTO "login_attempts" VALUES(187,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:02:52');
INSERT INTO "login_attempts" VALUES(188,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:04:43');
INSERT INTO "login_attempts" VALUES(189,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:05:34');
INSERT INTO "login_attempts" VALUES(190,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:08:27');
INSERT INTO "login_attempts" VALUES(191,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:09:35');
INSERT INTO "login_attempts" VALUES(192,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:48:50');
INSERT INTO "login_attempts" VALUES(193,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:50:30');
INSERT INTO "login_attempts" VALUES(194,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 08:53:42');
INSERT INTO "login_attempts" VALUES(195,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:08:10');
INSERT INTO "login_attempts" VALUES(196,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:09:59');
INSERT INTO "login_attempts" VALUES(197,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:11:00');
INSERT INTO "login_attempts" VALUES(198,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:12:19');
INSERT INTO "login_attempts" VALUES(199,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:13:01');
INSERT INTO "login_attempts" VALUES(200,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:16:21');
INSERT INTO "login_attempts" VALUES(201,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:17:16');
INSERT INTO "login_attempts" VALUES(202,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:18:22');
INSERT INTO "login_attempts" VALUES(203,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:18:48');
INSERT INTO "login_attempts" VALUES(204,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:19:39');
INSERT INTO "login_attempts" VALUES(205,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-18 09:24:04');
INSERT INTO "login_attempts" VALUES(206,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:29:03');
INSERT INTO "login_attempts" VALUES(207,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:30:54');
INSERT INTO "login_attempts" VALUES(208,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:31:47');
INSERT INTO "login_attempts" VALUES(209,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:32:42');
INSERT INTO "login_attempts" VALUES(210,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:33:24');
INSERT INTO "login_attempts" VALUES(211,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:48:32');
INSERT INTO "login_attempts" VALUES(212,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:50:12');
INSERT INTO "login_attempts" VALUES(213,'admin@remotehive.in','127.0.0.1','python-requests/2.31.0',1,NULL,'2025-08-18 09:51:26');
INSERT INTO "login_attempts" VALUES(214,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-20 06:45:50');
INSERT INTO "login_attempts" VALUES(215,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-20 09:08:52');
INSERT INTO "login_attempts" VALUES(216,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-20 12:48:21');
INSERT INTO "login_attempts" VALUES(217,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-20 12:53:57');
INSERT INTO "login_attempts" VALUES(218,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-20 16:40:12');
INSERT INTO "login_attempts" VALUES(219,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-20 19:12:21');
INSERT INTO "login_attempts" VALUES(220,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,NULL,'2025-08-20 19:12:46');
INSERT INTO "login_attempts" VALUES(221,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-21 08:59:44');
INSERT INTO "login_attempts" VALUES(222,'admin@remotehive.com','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',0,'Invalid admin credentials','2025-08-21 09:20:53');
INSERT INTO "login_attempts" VALUES(223,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-21 11:08:37');
INSERT INTO "login_attempts" VALUES(224,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-21 11:17:43');
INSERT INTO "login_attempts" VALUES(225,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-21 13:10:56');
INSERT INTO "login_attempts" VALUES(226,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-21 15:39:36');
INSERT INTO "login_attempts" VALUES(227,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-21 17:43:41');
INSERT INTO "login_attempts" VALUES(228,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-22 03:34:14');
INSERT INTO "login_attempts" VALUES(229,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,NULL,'2025-08-22 03:55:43');
INSERT INTO "login_attempts" VALUES(230,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-22 06:19:41');
INSERT INTO "login_attempts" VALUES(231,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-22 09:25:36');
INSERT INTO "login_attempts" VALUES(232,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-23 12:43:33');
INSERT INTO "login_attempts" VALUES(233,'admin@remotehive.in','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,NULL,'2025-08-25 05:37:22');
CREATE TABLE managed_websites (
                id TEXT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                base_url VARCHAR(500) NOT NULL,
                website_type VARCHAR(100) NOT NULL,
                scraper_class VARCHAR(255),
                is_active BOOLEAN DEFAULT 1,
                priority INTEGER DEFAULT 0,
                config TEXT DEFAULT '{}',
                selectors TEXT DEFAULT '{}',
                rate_limit_delay INTEGER DEFAULT 2,
                max_pages INTEGER DEFAULT 10,
                success_rate REAL DEFAULT 0.0,
                avg_jobs_per_page REAL DEFAULT 0.0,
                last_successful_scrape TIMESTAMP,
                total_scrapes INTEGER DEFAULT 0,
                successful_scrapes INTEGER DEFAULT 0,
                failed_scrapes INTEGER DEFAULT 0,
                ml_confidence_score REAL DEFAULT 0.0,
                ml_last_trained TIMESTAMP,
                auto_optimization_enabled BOOLEAN DEFAULT 0,
                tags TEXT DEFAULT '[]',
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            );
CREATE TABLE memory_uploads (
                id TEXT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                uploaded_by TEXT,
                upload_status VARCHAR(50) DEFAULT 'pending',
                total_rows INTEGER DEFAULT 0,
                processed_rows INTEGER DEFAULT 0,
                valid_rows INTEGER DEFAULT 0,
                invalid_rows INTEGER DEFAULT 0,
                progress_percentage REAL DEFAULT 0.0,
                validation_errors TEXT DEFAULT '[]',
                validation_warnings TEXT DEFAULT '[]',
                memory_type VARCHAR(100) NOT NULL,
                memory_data TEXT,
                description TEXT,
                tags TEXT DEFAULT '[]',
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_processing_at TIMESTAMP,
                completed_at TIMESTAMP,
                last_used_at TIMESTAMP, user_id TEXT NOT NULL DEFAULT 'admin',
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
            );
INSERT INTO "memory_uploads" VALUES('a1fc224c-c4da-40e5-9418-45c2eecc2818','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:29:05.207750',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('2f4e31b7-15f2-410a-a1d2-bb13dbf73da7','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:30:56.546788',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('82314507-5469-41b7-a993-14cd59813d1e','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:31:49.797616',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('116d591f-de4c-4653-8aed-c24f3d29e178','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:32:44.546855',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('f444ab27-a727-42b1-ac34-8105c09a1bb5','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:33:26.291709',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('2669244c-77bf-4b32-b20b-b946a45dfa8b','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:48:34.510648',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('909bcbf2-3fd7-42c1-ab6d-9adda9ec908e','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:50:14.639576',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
INSERT INTO "memory_uploads" VALUES('f2b84de4-dedf-4d26-b81c-d307ae4bf4ed','test_memory.csv','test_memory.csv',673,NULL,'PENDING',0,NULL,NULL,NULL,NULL,NULL,NULL,'csv',NULL,NULL,NULL,1,'2025-08-18 09:51:28.396480',NULL,NULL,NULL,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924');
CREATE TABLE ml_parsing_config (
	id VARCHAR(36) NOT NULL, 
	scraper_config_id VARCHAR(36) NOT NULL, 
	is_enabled BOOLEAN DEFAULT 'false' NOT NULL, 
	model_version VARCHAR(50) DEFAULT 'gemini-1.5-flash' NOT NULL, 
	confidence_threshold FLOAT DEFAULT '0.8' NOT NULL, 
	fallback_to_traditional BOOLEAN DEFAULT 'true' NOT NULL, 
	api_key_encrypted TEXT, 
	max_tokens INTEGER DEFAULT '1000' NOT NULL, 
	temperature FLOAT DEFAULT '0.1' NOT NULL, 
	usage_count INTEGER DEFAULT '0' NOT NULL, 
	success_count INTEGER DEFAULT '0' NOT NULL, 
	last_used DATETIME, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scraper_config_id) REFERENCES scraper_configs (id) ON DELETE CASCADE, 
	CONSTRAINT unique_ml_config UNIQUE (scraper_config_id)
);
INSERT INTO "ml_parsing_config" VALUES('34d9b61c-19b4-4f74-80e0-1f90d2d74916','26cbb08a-ae97-466a-b116-0f4f63243053',1,'gemini-1.5-pro',0.85,1,NULL,1500,0.05,0,0,NULL,'2025-08-12 10:12:30.013800','2025-08-12 10:12:30.013815');
CREATE TABLE ml_training_data (
                id TEXT PRIMARY KEY,
                source_type VARCHAR(100) NOT NULL,
                source_id TEXT,
                website_id TEXT,
                input_data TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                actual_output TEXT,
                confidence_score REAL,
                is_validated BOOLEAN DEFAULT 0,
                validated_by TEXT,
                validated_at TIMESTAMP,
                model_version VARCHAR(50),
                feature_vector TEXT,
                data_category VARCHAR(100),
                difficulty_level VARCHAR(50) DEFAULT 'medium',
                used_in_training BOOLEAN DEFAULT 0,
                training_batch_id VARCHAR(100),
                tags TEXT DEFAULT '[]',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (website_id) REFERENCES managed_websites(id) ON DELETE CASCADE,
                FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
            );
CREATE TABLE reviews (
	id INTEGER NOT NULL, 
	author VARCHAR(100) NOT NULL, 
	email VARCHAR(255), 
	rating INTEGER NOT NULL, 
	title VARCHAR(200), 
	content TEXT NOT NULL, 
	company VARCHAR(100), 
	position VARCHAR(100), 
	status VARCHAR(50), 
	featured BOOLEAN, 
	helpful_count INTEGER, 
	verified BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id)
);
CREATE TABLE role_permissions (
	id INTEGER NOT NULL, 
	role VARCHAR(50) NOT NULL, 
	permission VARCHAR(100) NOT NULL, 
	is_active BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id)
);
CREATE TABLE saved_jobs (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	job_post_id VARCHAR(36) NOT NULL, 
	notes TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(job_post_id) REFERENCES job_posts (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT unique_user_job_bookmark UNIQUE (user_id, job_post_id)
);
CREATE TABLE scheduler_jobs (
	id VARCHAR(36) NOT NULL, 
	scraper_config_id VARCHAR(36) NOT NULL, 
	job_name VARCHAR(255) NOT NULL, 
	cron_expression VARCHAR(100) NOT NULL, 
	is_active BOOLEAN DEFAULT 'true' NOT NULL, 
	next_run DATETIME, 
	last_run DATETIME, 
	run_count INTEGER DEFAULT '0' NOT NULL, 
	success_count INTEGER DEFAULT '0' NOT NULL, 
	failure_count INTEGER DEFAULT '0' NOT NULL, 
	max_retries INTEGER DEFAULT '3' NOT NULL, 
	retry_delay_minutes INTEGER DEFAULT '30' NOT NULL, 
	timeout_minutes INTEGER DEFAULT '60' NOT NULL, 
	priority INTEGER DEFAULT '5' NOT NULL, 
	metadata JSON, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scraper_config_id) REFERENCES scraper_configs (id) ON DELETE CASCADE, 
	CONSTRAINT unique_job_name UNIQUE (job_name)
);
INSERT INTO "scheduler_jobs" VALUES('a59763bc-d521-445d-97a2-d9fd50e2f4f7','26cbb08a-ae97-466a-b116-0f4f63243053','ml_demo_scraper_hourly','0 */2 * * *',1,'2025-08-12 12:12:30.020205',NULL,0,0,0,5,15,90,8,NULL,'2025-08-12 10:12:30.020291','2025-08-12 10:12:30.020299');
CREATE TABLE scraper_configs (
	id INTEGER NOT NULL, 
	source VARCHAR(16) NOT NULL, 
	scraper_name VARCHAR(255) NOT NULL, 
	base_url VARCHAR(500) NOT NULL, 
	search_queries JSON, 
	search_locations JSON, 
	max_pages INTEGER, 
	delay_between_requests INTEGER, 
	min_salary INTEGER, 
	max_salary INTEGER, 
	job_types JSON, 
	experience_levels JSON, 
	remote_only BOOLEAN, 
	auto_publish BOOLEAN, 
	duplicate_check_enabled BOOLEAN, 
	content_validation_enabled BOOLEAN, 
	schedule_enabled BOOLEAN, 
	schedule_interval_minutes INTEGER, 
	is_enabled BOOLEAN, 
	is_active BOOLEAN, 
	last_run_at DATETIME, 
	next_run_at DATETIME, 
	total_runs INTEGER, 
	successful_runs INTEGER, 
	failed_runs INTEGER, 
	total_jobs_found INTEGER, 
	total_jobs_created INTEGER, 
	total_jobs_updated INTEGER, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), ml_parsing_enabled BOOLEAN DEFAULT 'false' NOT NULL, ml_confidence_threshold FLOAT DEFAULT '0.8' NOT NULL, ml_fallback_enabled BOOLEAN DEFAULT 'true' NOT NULL, performance_mode VARCHAR(20) DEFAULT 'balanced' NOT NULL, concurrent_requests INTEGER DEFAULT '1' NOT NULL, request_timeout INTEGER DEFAULT '30' NOT NULL, retry_attempts INTEGER DEFAULT '3' NOT NULL, retry_delay INTEGER DEFAULT '5' NOT NULL, success_rate_threshold FLOAT DEFAULT '0.7' NOT NULL, auto_optimization_enabled BOOLEAN DEFAULT 'false' NOT NULL, last_optimization_date DATETIME, optimization_score FLOAT, dynamic_scheduling BOOLEAN DEFAULT 'false' NOT NULL, peak_hours_start INTEGER, peak_hours_end INTEGER, off_peak_interval_hours INTEGER, user_id VARCHAR(36), last_run DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "scraper_configs" VALUES(1,'INDEED','ML-Enhanced Demo Scraper','https://example-job-board.com',NULL,NULL,20,2,NULL,NULL,'[]','[]',0,0,1,1,0,60,1,0,NULL,NULL,0,0,0,0,0,0,'2025-08-16 12:42:56.222036','2025-08-16 12:42:56.222036',1,0.8,'true','balanced',1,30,3,5,0.7,'false',NULL,NULL,'false',NULL,NULL,NULL,'0303d341-cf59-4cc5-9dfb-3eeae4a600d7',NULL);
CREATE TABLE scraper_logs (
	id INTEGER NOT NULL, 
	scraper_config_id INTEGER, 
	source VARCHAR(16) NOT NULL, 
	scraper_name VARCHAR(255) NOT NULL, 
	search_query VARCHAR(500), 
	search_location VARCHAR(255), 
	status VARCHAR(9), 
	started_at DATETIME, 
	completed_at DATETIME, 
	duration_seconds INTEGER, 
	pages_scraped INTEGER, 
	jobs_found INTEGER, 
	jobs_created INTEGER, 
	jobs_updated INTEGER, 
	jobs_skipped INTEGER, 
	jobs_failed INTEGER, 
	error_message TEXT, 
	error_details JSON, 
	config_snapshot JSON, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(scraper_config_id) REFERENCES scraper_configs (id)
);
CREATE TABLE scraper_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scraper_name VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    content TEXT NOT NULL,
                    tags TEXT DEFAULT '[]',
                    is_active BOOLEAN DEFAULT 1,
                    usage_count INTEGER DEFAULT 0,
                    last_used_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
INSERT INTO "scraper_memory" VALUES(1,'remote-europe.com','European remote job board','{"selectors": {"job_title": ".job-title", "company": ".company-name", "location": ".location"}}','["remote", "europe"]',1,0,NULL,'2025-08-17 20:29:58','2025-08-17 20:29:58');
INSERT INTO "scraper_memory" VALUES(2,'arc.dev','Tech-focused job board','{"selectors": {"job_title": "h3.job-title", "company": ".company", "location": ".location"}}','["tech", "remote"]',1,0,NULL,'2025-08-17 20:29:58','2025-08-17 20:29:58');
INSERT INTO "scraper_memory" VALUES(3,'remote4me.com','General remote job listings','{"selectors": {"job_title": ".title", "company": ".company", "location": ".loc"}}','["remote", "general"]',1,0,NULL,'2025-08-17 20:29:58','2025-08-17 20:29:58');
CREATE TABLE scraper_state (
	id VARCHAR(36) NOT NULL, 
	scraper_config_id VARCHAR(36) NOT NULL, 
	status VARCHAR(20) DEFAULT 'idle' NOT NULL, 
	current_page INTEGER DEFAULT '0', 
	total_pages INTEGER, 
	jobs_found INTEGER DEFAULT '0', 
	jobs_saved INTEGER DEFAULT '0', 
	start_time DATETIME, 
	last_update DATETIME, 
	redis_key VARCHAR(255), 
	error_message TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(scraper_config_id) REFERENCES scraper_configs (id) ON DELETE CASCADE, 
	CONSTRAINT unique_scraper_state UNIQUE (scraper_config_id)
);
CREATE TABLE scraper_website_mapping (
	scraper_config_id INTEGER NOT NULL, 
	managed_website_id VARCHAR NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (scraper_config_id, managed_website_id), 
	FOREIGN KEY(scraper_config_id) REFERENCES scraper_configs (id), 
	FOREIGN KEY(managed_website_id) REFERENCES managed_websites (id)
);
CREATE TABLE scraping_metrics (
                id TEXT PRIMARY KEY,
                metric_type VARCHAR(100) NOT NULL,
                session_id TEXT,
                website_id TEXT,
                period_start TIMESTAMP NOT NULL,
                period_end TIMESTAMP NOT NULL,
                jobs_found INTEGER DEFAULT 0,
                jobs_processed INTEGER DEFAULT 0,
                jobs_saved INTEGER DEFAULT 0,
                jobs_duplicated INTEGER DEFAULT 0,
                jobs_failed INTEGER DEFAULT 0,
                total_processing_time_seconds INTEGER DEFAULT 0,
                avg_time_per_job_ms REAL DEFAULT 0.0,
                avg_time_per_page_seconds REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 0.0,
                error_rate REAL DEFAULT 0.0,
                duplicate_rate REAL DEFAULT 0.0,
                ml_confidence_avg REAL,
                ml_accuracy_rate REAL,
                ml_processing_time_ms REAL,
                error_categories TEXT DEFAULT '{}',
                common_failures TEXT DEFAULT '[]',
                memory_usage_mb REAL,
                cpu_usage_percent REAL,
                network_requests INTEGER DEFAULT 0,
                metrics_data TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (website_id) REFERENCES managed_websites(id) ON DELETE CASCADE
            );
CREATE TABLE scraping_results (
	id INTEGER NOT NULL, 
	session_id VARCHAR NOT NULL, 
	website_id INTEGER NOT NULL, 
	url VARCHAR NOT NULL, 
	success VARCHAR, 
	status_code INTEGER, 
	response_time FLOAT, 
	extracted_data JSON, 
	selectors_used JSON, 
	html_content TEXT, 
	error_message TEXT, 
	error_type VARCHAR, 
	retry_count INTEGER, 
	screenshot_path VARCHAR, 
	user_agent VARCHAR, 
	scraping_method VARCHAR, 
	scraped_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE scraping_sessions (
                id TEXT PRIMARY KEY,
                session_name VARCHAR(255) NOT NULL,
                websites TEXT NOT NULL,
                memory_uploads TEXT DEFAULT '[]',
                scraping_config TEXT DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'pending',
                priority INTEGER DEFAULT 0,
                total_websites INTEGER DEFAULT 0,
                completed_websites INTEGER DEFAULT 0,
                failed_websites INTEGER DEFAULT 0,
                total_jobs_found INTEGER DEFAULT 0,
                total_jobs_processed INTEGER DEFAULT 0,
                total_jobs_saved INTEGER DEFAULT 0,
                progress_percentage REAL DEFAULT 0.0,
                avg_processing_time_per_job REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 0.0,
                error_rate REAL DEFAULT 0.0,
                ml_enabled BOOLEAN DEFAULT 0,
                ml_confidence_threshold REAL DEFAULT 0.8,
                ml_processing_count INTEGER DEFAULT 0,
                ml_success_count INTEGER DEFAULT 0,
                started_by TEXT,
                started_at TIMESTAMP,
                paused_at TIMESTAMP,
                resumed_at TIMESTAMP,
                completed_at TIMESTAMP,
                error_message TEXT,
                error_details TEXT,
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL
            );
CREATE TABLE seo_settings (
	id INTEGER NOT NULL, 
	site_title VARCHAR(255), 
	site_description TEXT, 
	meta_keywords TEXT, 
	og_title VARCHAR(255), 
	og_description TEXT, 
	og_image VARCHAR(500), 
	og_type VARCHAR(50), 
	twitter_card VARCHAR(50), 
	twitter_site VARCHAR(100), 
	twitter_creator VARCHAR(100), 
	canonical_url VARCHAR(500), 
	robots_txt TEXT, 
	sitemap_url VARCHAR(500), 
	google_analytics_id VARCHAR(100), 
	google_tag_manager_id VARCHAR(100), 
	facebook_pixel_id VARCHAR(100), 
	google_site_verification VARCHAR(100), 
	bing_site_verification VARCHAR(100), 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id)
);
CREATE TABLE session_websites (
	id INTEGER NOT NULL, 
	session_id VARCHAR NOT NULL, 
	website_id INTEGER NOT NULL, 
	status VARCHAR(10) NOT NULL, 
	priority INTEGER, 
	assigned_at DATETIME, 
	started_at DATETIME, 
	completed_at DATETIME, 
	result_id INTEGER, 
	retry_count INTEGER, 
	max_retries INTEGER, 
	last_error TEXT, 
	PRIMARY KEY (id)
);
CREATE TABLE system_settings (
	id INTEGER NOT NULL, 
	"key" VARCHAR(100) NOT NULL, 
	value TEXT, 
	data_type VARCHAR(20), 
	description TEXT, 
	is_public BOOLEAN, 
	updated_by VARCHAR(36), 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	UNIQUE ("key"), 
	FOREIGN KEY(updated_by) REFERENCES users (id)
);
INSERT INTO "system_settings" VALUES(1,'site_name','RemoteHive','string','Name of the website',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(2,'site_description','Find your perfect remote job opportunity','string','Site description for SEO',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(3,'jobs_per_page','12','integer','Number of jobs to display per page',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(4,'max_file_upload_size','5242880','integer','Maximum file upload size in bytes (5MB)',0,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(5,'allowed_file_types','pdf,doc,docx','string','Allowed file types for uploads',0,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(6,'email_notifications_enabled','true','boolean','Enable email notifications',0,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(7,'job_post_approval_required','false','boolean','Require admin approval for job posts',0,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(8,'maintenance_mode','false','boolean','Enable maintenance mode',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(9,'contact_email','contact@remotehive.com','string','Contact email address',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(10,'support_email','support@remotehive.com','string','Support email address',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(11,'featured_jobs_limit','6','integer','Number of featured jobs to display',1,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(12,'job_expiry_days','30','integer','Number of days before job posts expire',0,NULL,'2025-08-05 06:05:40','2025-08-05 06:05:40');
INSERT INTO "system_settings" VALUES(13,'auto_approve_employers','true','boolean','Automatically approve new employer registrations',0,NULL,'2025-08-05 06:05:41','2025-08-05 06:05:41');
INSERT INTO "system_settings" VALUES(14,'enable_job_alerts','true','boolean','Enable job alert notifications',1,NULL,'2025-08-05 06:05:41','2025-08-05 06:05:41');
INSERT INTO "system_settings" VALUES(15,'social_login_enabled','true','boolean','Enable social media login',1,NULL,'2025-08-05 06:05:41','2025-08-05 06:05:41');
INSERT INTO "system_settings" VALUES(16,'email_host','smtp.gmail.com','string','SMTP setting: email_host',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.401921');
INSERT INTO "system_settings" VALUES(17,'email_port','587','string','SMTP setting: email_port',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.402737');
INSERT INTO "system_settings" VALUES(18,'email_username','remotehive.official@gmail.com','string','SMTP setting: email_username',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.403007');
INSERT INTO "system_settings" VALUES(19,'email_password','Ranjeet11$','string','SMTP setting: email_password',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.403231');
INSERT INTO "system_settings" VALUES(20,'email_from','noreply@remotehive.com','string','SMTP setting: email_from',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.403433');
INSERT INTO "system_settings" VALUES(21,'email_use_tls','True','string','SMTP setting: email_use_tls',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.404091');
INSERT INTO "system_settings" VALUES(22,'email_use_ssl','False','string','SMTP setting: email_use_ssl',0,NULL,'2025-08-10 08:59:06','2025-08-11 04:50:33.404421');
CREATE TABLE user_sessions (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	session_token VARCHAR(255) NOT NULL, 
	ip_address VARCHAR(45), 
	user_agent VARCHAR(500), 
	is_active BOOLEAN, 
	expires_at DATETIME NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	last_activity DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	UNIQUE (session_token)
);
INSERT INTO "user_sessions" VALUES(1,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','kpY0eGGzaowUsvDJKzuFRaAWPBIKS1QXy_014k1ZWQE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-08 11:25:54.737678','2025-08-07 11:25:54','2025-08-07 11:25:54');
INSERT INTO "user_sessions" VALUES(2,'dc8d7f97-6dd2-4f37-99b0-21476bf33156','Bm5TEi_jF8duQg5BM7CqLIGXQ6Vc-7epiIEJ2nxvhIs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-08 11:26:34.493531','2025-08-07 11:26:34','2025-08-07 11:26:34');
INSERT INTO "user_sessions" VALUES(3,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','q67ikW8j0Xwqjn9Jr2J_ymwM8LrTl8KzOzMiyk4sZI4','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-08 11:26:56.828790','2025-08-07 11:26:56','2025-08-07 11:26:56');
INSERT INTO "user_sessions" VALUES(4,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','tmMhiJLi2sCvBEgXKqyN2wUZSmhoCvxKB9wE86CgBWg','127.0.0.1','python-requests/2.31.0',1,'2025-08-09 06:03:38.979959','2025-08-08 06:03:38','2025-08-08 06:03:38');
INSERT INTO "user_sessions" VALUES(5,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','6TDFaxPPMX1pCUacWlFy4yu_h5zEuFNlTtb2nofgnnk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-09 06:05:47.901649','2025-08-08 06:05:47','2025-08-08 06:05:47');
INSERT INTO "user_sessions" VALUES(6,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','qrTQ5Hp0jqVDKgmSqnrR_34o7dKQpCCm_s7XTDvxe-E','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-09 06:11:10.762740','2025-08-08 06:11:10','2025-08-08 06:11:10');
INSERT INTO "user_sessions" VALUES(7,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','CjQqUsvbP9cjt0OIhzfu2irIcF4VIycTcLjGIAva46E','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-09 06:14:27.460150','2025-08-08 06:14:27','2025-08-08 06:14:27');
INSERT INTO "user_sessions" VALUES(8,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','QQTZlvPvYfGiJOsLxWoEmnBw1cVHvzJ3pknj2eaGQ80','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-09 06:18:26.614506','2025-08-08 06:18:26','2025-08-08 06:18:26');
INSERT INTO "user_sessions" VALUES(9,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','Ma1KAaQ5pi7I2cC6_Su-H-Os3j6FmTyWMhS1I8jqgQk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-09 06:19:22.261272','2025-08-08 06:19:22','2025-08-08 06:19:22');
INSERT INTO "user_sessions" VALUES(10,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','DgKLi26ATtXOdZdb0nvjEUszWK4lCWeEwfRnE3K0Mls','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-09 06:22:46.802342','2025-08-08 06:22:46','2025-08-08 06:22:46');
INSERT INTO "user_sessions" VALUES(11,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','B85k2xTEC15QtGAjB9odPdd1t5_zAX55IdggANM-z-g','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-09 09:58:32.729625','2025-08-08 09:58:32','2025-08-08 09:58:32');
INSERT INTO "user_sessions" VALUES(12,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','DWSVDhqxXMuWW8IrAKmHOIVfKMl8pbrrx9fqHsCvefI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-09 09:58:51.837014','2025-08-08 09:58:51','2025-08-08 09:58:51');
INSERT INTO "user_sessions" VALUES(13,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','XGA2uTjr9O_a-Mfq4ll2AMtD-fDS_A0Ltn0xH_fEl9A','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-10 09:49:52.455785','2025-08-09 09:49:52','2025-08-09 09:49:52');
INSERT INTO "user_sessions" VALUES(14,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','tdAR8ial1j2d9cS3Wfzbxqso2x2mPAUipUkqc0tCKEY','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-10 10:30:16.966605','2025-08-09 10:30:16','2025-08-09 10:30:16');
INSERT INTO "user_sessions" VALUES(15,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','YfwhgJa5Omoo00upS2TXfoPzqMzFLa51a8d-qwsncFo','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-10 13:06:46.079922','2025-08-09 13:06:46','2025-08-09 13:06:46');
INSERT INTO "user_sessions" VALUES(16,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','H_OKKglqeSPGPNeU6B2KDrUcaihqGIoTIhl5E-PKn6I','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-10 13:39:25.312690','2025-08-09 13:39:25','2025-08-09 13:39:25');
INSERT INTO "user_sessions" VALUES(17,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','DTEZVM5D8gJLqgZS3JwV7XhkGLKccXznKPm1UcTSvGo','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-10 13:39:51.271992','2025-08-09 13:39:51','2025-08-09 13:39:51');
INSERT INTO "user_sessions" VALUES(18,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','4iO5PmptvfbB8ebQsWmeUgb9F11fOvdeQ_opE3720pg','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 13:47:31.853114','2025-08-09 13:47:31','2025-08-09 13:47:31');
INSERT INTO "user_sessions" VALUES(19,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','ZYuvM-XCqTSCvk7r-Btd37xvJwrHiiM8vMqNG_6lgkU','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 13:51:11.719635','2025-08-09 13:51:11','2025-08-09 13:51:11');
INSERT INTO "user_sessions" VALUES(20,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','ePLLB95LS57edO1sVoVpZzrhyYTY5RecsTUyELbMVr8','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:00:34.513243','2025-08-09 14:00:34','2025-08-09 14:00:34');
INSERT INTO "user_sessions" VALUES(21,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','JSQ5Xke3COylmE6IhGgjig3OqPoCmlR7uNyhHCvUEsQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:01:46.386552','2025-08-09 14:01:46','2025-08-09 14:01:46');
INSERT INTO "user_sessions" VALUES(22,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','ZKIRlMwgplSYJguXkSBDG8kj66DQbUNEtTDP1szdRJ8','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:14:03.541794','2025-08-09 14:14:03','2025-08-09 14:14:03');
INSERT INTO "user_sessions" VALUES(23,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','X16WhqYYBWwtePP-749Psu2hdWGgRmpbQ2Af1jyGcPs','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:15:31.174316','2025-08-09 14:15:31','2025-08-09 14:15:31');
INSERT INTO "user_sessions" VALUES(24,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','YzTCkTCyYJb9CvsPRYtnYcONqcr4x8nJ3iOudgiasyc','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:21:40.338229','2025-08-09 14:21:40','2025-08-09 14:21:40');
INSERT INTO "user_sessions" VALUES(25,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','bXxshGa2JauqFD-e87eHCLVaotD0MZX7Bb82_8iHCFE','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:22:32.121016','2025-08-09 14:22:32','2025-08-09 14:22:32');
INSERT INTO "user_sessions" VALUES(26,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','fPSiY6XpqJdNHNs1dV2nO6q9J2mQ3RkNZ1JgTiacctE','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:23:23.972680','2025-08-09 14:23:23','2025-08-09 14:23:23');
INSERT INTO "user_sessions" VALUES(27,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','3KffNnSg7jOc9l4Sdr5CBEyoMemgEkh2BBXKDJrYDQA','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:25:21.883749','2025-08-09 14:25:21','2025-08-09 14:25:21');
INSERT INTO "user_sessions" VALUES(28,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','jcRmaWbVzUbAM_qWRf_FnJPEHi8p2Muveky0SRCm0xM','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:27:18.831928','2025-08-09 14:27:18','2025-08-09 14:27:18');
INSERT INTO "user_sessions" VALUES(29,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','cV89QU80urYcYpWhi2dJffzrmQUECv7qN-tcyf10954','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:28:55.449764','2025-08-09 14:28:55','2025-08-09 14:28:55');
INSERT INTO "user_sessions" VALUES(30,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','C3-Xwy9TUvWYYeRZ7Iw8XzS4K4Txo32xcc7m87uVTOg','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:32:08.346246','2025-08-09 14:32:08','2025-08-09 14:32:08');
INSERT INTO "user_sessions" VALUES(31,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','jSLAgIafeQdmhtP-u_0S9zgmrdugnS1rXe1oMZZxPI4','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:39:36.112340','2025-08-09 14:39:36','2025-08-09 14:39:36');
INSERT INTO "user_sessions" VALUES(32,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','JMo9kFWxlqEIlnsDBpOnOwU84Ba9BeT3SfsY4rYuJNI','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:41:00.817441','2025-08-09 14:41:00','2025-08-09 14:41:00');
INSERT INTO "user_sessions" VALUES(33,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','3y5-8On43JPhOibmugemfWZCJP-gTVAAe9MRKehVIwQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:42:09.164411','2025-08-09 14:42:09','2025-08-09 14:42:09');
INSERT INTO "user_sessions" VALUES(34,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','0ln8IwpolziG58tTyIBUd9AnADZNXA_XRCGrBrtSnCA','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 14:53:30.031397','2025-08-09 14:53:30','2025-08-09 14:53:30');
INSERT INTO "user_sessions" VALUES(35,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','u8Vnzs4QcgmBZI1JRX3IFNfi37SN8nNoslle70Q4Lhg','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:04:44.610333','2025-08-09 15:04:44','2025-08-09 15:04:44');
INSERT INTO "user_sessions" VALUES(36,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','hJOoDvKo-g1QTlygg9RNQJUdBZYRS_Xe0vP1OnohOG0','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:05:29.672859','2025-08-09 15:05:29','2025-08-09 15:05:29');
INSERT INTO "user_sessions" VALUES(37,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','KIe0BwyDp3_ThDGQ82htXCkWiTouYthP92c7CDWPezM','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:06:30.611138','2025-08-09 15:06:30','2025-08-09 15:06:30');
INSERT INTO "user_sessions" VALUES(38,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','8z2n3WI26iyaITh73x_cAXwvA-9JK6MgZHZCZx-gB4M','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:08:19.609271','2025-08-09 15:08:19','2025-08-09 15:08:19');
INSERT INTO "user_sessions" VALUES(39,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Uo9eYazhDtFu6XOgp0oLzmHH9aWKVCm0tImQsT-GCOA','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:13:00.311075','2025-08-09 15:13:00','2025-08-09 15:13:00');
INSERT INTO "user_sessions" VALUES(40,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Qq8T7Bgx0hr5N7zWLI4Ltb1DtnHss8GqPmsLE13oEsQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:13:04.960791','2025-08-09 15:13:04','2025-08-09 15:13:04');
INSERT INTO "user_sessions" VALUES(41,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','i_h156KA9anb-B4yjZfwYE_M2NYmnM8Syxc6AWh-5gw','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:14:09.921487','2025-08-09 15:14:09','2025-08-09 15:14:09');
INSERT INTO "user_sessions" VALUES(42,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','s8i4sLp7ZM719PZJeZ2qXPpNnVRHN00oVM6oBTnSZMw','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:21:25.847903','2025-08-09 15:21:25','2025-08-09 15:21:25');
INSERT INTO "user_sessions" VALUES(43,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','UhXvh3QDTqX6ug_rilU6NlanyH58bAGF1KJgTHlKFCk','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:22:53.443867','2025-08-09 15:22:53','2025-08-09 15:22:53');
INSERT INTO "user_sessions" VALUES(44,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','IAW3NHi7-DDNzQO277Lq8210gmL3vww5E8Lh3r1idZM','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:23:37.608503','2025-08-09 15:23:37','2025-08-09 15:23:37');
INSERT INTO "user_sessions" VALUES(45,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','pXfawmVWvVEO54iZBHvqKS_hv5Adggi00uSIMwAxraM','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:26:19.252346','2025-08-09 15:26:19','2025-08-09 15:26:19');
INSERT INTO "user_sessions" VALUES(46,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Tekd2wme7IFd5BFIY1vnhjDvY04znknSipOtYOE8nRw','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:43:44.223413','2025-08-09 15:43:44','2025-08-09 15:43:44');
INSERT INTO "user_sessions" VALUES(47,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','dxpq-cxSJR43cX0-GRAuXgVu56oIjbWeoSztQygYKGA','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 15:44:39.664222','2025-08-09 15:44:39','2025-08-09 15:44:39');
INSERT INTO "user_sessions" VALUES(48,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','E9ddveElZUq7jcS9vlYGRF23BncUVYqh_zDeyMBgTEw','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 16:06:21.773682','2025-08-09 16:06:21','2025-08-09 16:06:21');
INSERT INTO "user_sessions" VALUES(49,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','giZ3RzbVXsWxfOKlROiS-wxOzAYOON5U_dpXEhp-4Hg','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 16:12:34.764062','2025-08-09 16:12:34','2025-08-09 16:12:34');
INSERT INTO "user_sessions" VALUES(50,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','TYxJV0E3ojON2DGsjos9Y_xnPtfEoO0wJKPqMX_UWso','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 16:16:16.015771','2025-08-09 16:16:16','2025-08-09 16:16:16');
INSERT INTO "user_sessions" VALUES(51,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','eAHPytaKXIWFBLKCJurceQZcqeXVzpe7gz7OdpSMwQk','127.0.0.1','python-requests/2.31.0',1,'2025-08-10 16:21:35.013284','2025-08-09 16:21:35','2025-08-09 16:21:35');
INSERT INTO "user_sessions" VALUES(52,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','3p5k4kKcZF3U6gGnGWvGFP9ZBOuI9K_Jkm9gBDQBWMc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-10 18:21:46.281844','2025-08-09 18:21:46','2025-08-09 18:21:46');
INSERT INTO "user_sessions" VALUES(53,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','KY1a8BDHHw_B3OQlM9fb2iX5LwBRzZRjdvEIeky6ij8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-11 08:35:01.783941','2025-08-10 08:35:01','2025-08-10 08:35:01');
INSERT INTO "user_sessions" VALUES(54,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','S5RjaoDomjN5-UhVr_v6D9tDiFMswRWXF8f1CRDoH7s','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:46:57.486537','2025-08-10 08:46:57','2025-08-10 08:46:57');
INSERT INTO "user_sessions" VALUES(55,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','gTXEwI1vN3_07HHAlMftEJIQ7ov46iT1xHahQXxMPDc','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:47:15.733617','2025-08-10 08:47:15','2025-08-10 08:47:15');
INSERT INTO "user_sessions" VALUES(56,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','ANwpAIslaCl7EdzE_D-NoEHcBvdGSIri9KlhN6sHvGU','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:48:22.774635','2025-08-10 08:48:22','2025-08-10 08:48:22');
INSERT INTO "user_sessions" VALUES(57,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','f1vfwXtok8Y0HIqLYjmYgS5srueG_qkaDxXQRf8mWg0','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:55:14.898001','2025-08-10 08:55:14','2025-08-10 08:55:14');
INSERT INTO "user_sessions" VALUES(58,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','OKdlzc3ZYuNwSpQRiP1VNOhZm_hpWvlUlVvZTLCjiuo','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:55:46.076049','2025-08-10 08:55:46','2025-08-10 08:55:46');
INSERT INTO "user_sessions" VALUES(59,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','QelFn8ObR6msnRWKPZ-0g-UNlwvmipIKOautBqJlbgU','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:59:04.893229','2025-08-10 08:59:04','2025-08-10 08:59:04');
INSERT INTO "user_sessions" VALUES(60,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','2fOyi0Evv7dUbebAM2MVCehNCnJ2qG-MXqmA296yH9E','127.0.0.1','python-requests/2.31.0',1,'2025-08-11 08:59:53.160997','2025-08-10 08:59:53','2025-08-10 08:59:53');
INSERT INTO "user_sessions" VALUES(61,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','YlzqILJpCKlEVSVkahSf9oB1nkNOsIFETrXdVczdwDw','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',1,'2025-08-11 10:37:13.394873','2025-08-10 10:37:13','2025-08-10 10:37:13');
INSERT INTO "user_sessions" VALUES(62,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','EtcYvp-zQduZNIAKHQnvPKuQ-Kz8__sSAZW9lxF3ArA','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',1,'2025-08-11 10:38:17.495581','2025-08-10 10:38:17','2025-08-10 10:38:17');
INSERT INTO "user_sessions" VALUES(63,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','DAfqoHDVljKHO-hsZhBLo0wNHD2jyjY_zQi6bhsiM90','127.0.0.1','Playwright/1.53.1 (x64; windows 10.0) node/22.15',1,'2025-08-11 10:39:59.461657','2025-08-10 10:39:59','2025-08-10 10:39:59');
INSERT INTO "user_sessions" VALUES(64,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','JLYLgwv8I-yM9YHOQRqQzUvOVIbqk9jQ1uC-gIBeDDk','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-11 13:10:12.557828','2025-08-10 13:10:12','2025-08-10 13:10:12');
INSERT INTO "user_sessions" VALUES(65,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','THpCKzGae2D37HVQJ2CzsOuRcbPk6YNvTkLr7UMOvR4','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-11 13:10:27.895623','2025-08-10 13:10:27','2025-08-10 13:10:27');
INSERT INTO "user_sessions" VALUES(66,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','GXDWr4Hy-0ORGPFOEHyzm1wR_aLY_45VruDCFX9BcPc','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-11 13:10:50.671567','2025-08-10 13:10:50','2025-08-10 13:10:50');
INSERT INTO "user_sessions" VALUES(67,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','wFQJjmvYPEkqh6a2HR4xwWtjM_iZc3_8Rb49As179us','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-12 04:49:51.930116','2025-08-11 04:49:51','2025-08-11 04:49:51');
INSERT INTO "user_sessions" VALUES(68,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','g-nb7dtylN_iJYCYmOIu0_GfMfC6cQUcC7obq5V3TjI','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:00:31.902884','2025-08-11 05:00:31','2025-08-11 05:00:31');
INSERT INTO "user_sessions" VALUES(69,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','dG81UwunEncccrOvTOGYH47d2zs479SwTyA7X9Zg5Nc','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:02:16.358838','2025-08-11 05:02:16','2025-08-11 05:02:16');
INSERT INTO "user_sessions" VALUES(70,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','HV8AstPZeixHrpQ8I6NhQSo17UtQlV3H_z4p0ygCVXU','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:04:14.957224','2025-08-11 05:04:14','2025-08-11 05:04:14');
INSERT INTO "user_sessions" VALUES(71,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','HjIch-ehAqSO48JexGCZy6uGdcVWY3eVdcmcLKb_F2o','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:06:46.153019','2025-08-11 05:06:46','2025-08-11 05:06:46');
INSERT INTO "user_sessions" VALUES(72,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','ObA6DCB8z99HOvgTOK5XkJlb95MhkYvULy_spbTONX0','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:08:45.488736','2025-08-11 05:08:45','2025-08-11 05:08:45');
INSERT INTO "user_sessions" VALUES(73,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','X3C937Dm4WAWn1IbAJUxsEiTTL7-aDemmxHCqemLot0','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:09:53.333062','2025-08-11 05:09:53','2025-08-11 05:09:53');
INSERT INTO "user_sessions" VALUES(74,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','pJDJ8dqRzpclNbz8zUQCp6CB-cPYCeZLxFHm6u0UOts','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:12:34.067374','2025-08-11 05:12:34','2025-08-11 05:12:34');
INSERT INTO "user_sessions" VALUES(75,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','JS2s-Fitb80-nEQj5W2hYb5qW8ayF4VoXniFlENu9XQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 05:13:24.553113','2025-08-11 05:13:24','2025-08-11 05:13:24');
INSERT INTO "user_sessions" VALUES(76,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','bYwp80YQWWJg1mVaNNZ6vTK1LbblQNukUat96SP56P0','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-12 06:00:44.155861','2025-08-11 06:00:44','2025-08-11 06:00:44');
INSERT INTO "user_sessions" VALUES(77,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','KX68eJXGMIwcSsP-_IMl-F1Vmt0f9S4uI9SFtAHcmFA','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-12 06:20:20.122787','2025-08-11 06:20:20','2025-08-11 06:20:20');
INSERT INTO "user_sessions" VALUES(78,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','vHqu1xG4C0keBlo28nyKGxmnz4fHI_RHNPRGPwwRfUc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-12 11:37:18.081501','2025-08-11 11:37:18','2025-08-11 11:37:18');
INSERT INTO "user_sessions" VALUES(79,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','-LX7aAH0ipy_lHPR4-XkwjKpSxtwfac2OOboHf06ltc','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 11:43:25.589963','2025-08-11 11:43:25','2025-08-11 11:43:25');
INSERT INTO "user_sessions" VALUES(80,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','EpUH-RuhLV1U52t_RYFIKxEYDcKMxAwiIZOqb80POWc','127.0.0.1','python-requests/2.31.0',1,'2025-08-12 12:03:36.040998','2025-08-11 12:03:36','2025-08-11 12:03:36');
INSERT INTO "user_sessions" VALUES(81,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','IXRFvTUn2qZkKUPBCXXTUnaLyfXGGxYmLS98gzF7LFY','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-12 18:37:33.147132','2025-08-11 18:37:33','2025-08-11 18:37:33');
INSERT INTO "user_sessions" VALUES(82,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','n2AvOQXoyzlOvqGFoUkP1zzFr0Oam9boaZdzO9WMoG8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-12 18:38:32.520058','2025-08-11 18:38:32','2025-08-11 18:38:32');
INSERT INTO "user_sessions" VALUES(83,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','FP377ou5h0eKifTsGQ0SHCWx4TtCF3hEvAZoSO-UO3o','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:09:56.549233','2025-08-11 21:09:56','2025-08-11 21:09:56');
INSERT INTO "user_sessions" VALUES(84,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','jY9CquAe6ZXQ0O4xSNsEwJl18cWd0MU3xCAVI8hUOTU','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:09:57.307734','2025-08-11 21:09:57','2025-08-11 21:09:57');
INSERT INTO "user_sessions" VALUES(85,'967a82e2-83ba-4267-952c-361eef927bfc','mqolatJTR57Xb9Q3DQ4nGY26ffRsAECsxITC3DolSZY','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:11:25.721992','2025-08-11 21:11:25','2025-08-11 21:11:25');
INSERT INTO "user_sessions" VALUES(86,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','grICbVOd-cYs6BihCfjuq9bltxVTOqPay9-infv628A','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:13:53.018444','2025-08-11 21:13:53','2025-08-11 21:13:53');
INSERT INTO "user_sessions" VALUES(87,'dc8d7f97-6dd2-4f37-99b0-21476bf33156','hNKzz3t5zAN2wz816N9dmzNCXfsnkaGCWGxcgnmNLTo','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:14:07.177712','2025-08-11 21:14:07','2025-08-11 21:14:07');
INSERT INTO "user_sessions" VALUES(88,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','4sMOVw8U4di3AXNCYPYKnTlOAqgyDOzX6hocJAi_dTA','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:15:30.430309','2025-08-11 21:15:30','2025-08-11 21:15:30');
INSERT INTO "user_sessions" VALUES(89,'ebcb22ba-4404-4b8a-833e-714168e7d91f','aTPe7ec34NK62VNVywtNoFNSP0EUiqPMZM5V62vobpw','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:17:13.177878','2025-08-11 21:17:13','2025-08-11 21:17:13');
INSERT INTO "user_sessions" VALUES(90,'967a82e2-83ba-4267-952c-361eef927bfc','AUsUUNLERTww95VNpMVtY2RW8Eai2U8F2xSI_PSLG6w','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-12 21:17:25.799746','2025-08-11 21:17:25','2025-08-11 21:17:25');
INSERT INTO "user_sessions" VALUES(91,'1469e4db-899e-497c-813a-5be73a8b4c1a','x3bRtNClhq7O0jdOwMYmpgv8y4rpUKci6pdQOkVMfrA','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:09:18.533429','2025-08-12 05:09:18','2025-08-12 05:09:18');
INSERT INTO "user_sessions" VALUES(92,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','zTFm3qn4CgOUtPlL5T5bHWC3i0nRDrLrm5OqQoAHxoc','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:09:50.335772','2025-08-12 05:09:50','2025-08-12 05:09:50');
INSERT INTO "user_sessions" VALUES(93,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','w4_PtbzbZPsUhl_vAdNiYo-BCy9JHpSN5h1mmI_o7TI','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:09:58.297058','2025-08-12 05:09:58','2025-08-12 05:09:58');
INSERT INTO "user_sessions" VALUES(94,'dc8d7f97-6dd2-4f37-99b0-21476bf33156','iCR_2h1YJdPQViW4hsCVpwZpoohfZAxTWdDg_O9UvwY','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:10:04.622726','2025-08-12 05:10:04','2025-08-12 05:10:04');
INSERT INTO "user_sessions" VALUES(95,'dc8d7f97-6dd2-4f37-99b0-21476bf33156','iunpJ6NgAgl52szLcNdpZvx8FTP3SAcD-47jXnXZMa8','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:10:10.311713','2025-08-12 05:10:10','2025-08-12 05:10:10');
INSERT INTO "user_sessions" VALUES(96,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','Fk2CYcxcJnd0upRkJ6TrQzoUajlmmNlPm-Ur11xvFWo','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:11:06.019184','2025-08-12 05:11:06','2025-08-12 05:11:06');
INSERT INTO "user_sessions" VALUES(97,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','iF5KxBSm6hZijmd15x3Y1jD4B5jeBxeaMOFltVkzr38','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:11:16.339570','2025-08-12 05:11:16','2025-08-12 05:11:16');
INSERT INTO "user_sessions" VALUES(98,'8074f8f2-890c-42ea-b158-9ba36aaa3dcf','WhWA3o8MM8-3nSogZfVOcky_DPYrHReI_R0ca86r2H4','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-13 05:11:18.466308','2025-08-12 05:11:18','2025-08-12 05:11:18');
INSERT INTO "user_sessions" VALUES(99,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','KlXumNd1s0FFepJ1uw2gHw0M4iTKXEo04t8_siObvSQ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-13 05:31:30.712049','2025-08-12 05:31:30','2025-08-12 05:31:30');
INSERT INTO "user_sessions" VALUES(100,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','HMQrCPtg8u1O6cBHka3HHOehHujLqrbdDCzTeH0Eqvk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-13 08:27:39.888603','2025-08-12 08:27:39','2025-08-12 08:27:39');
INSERT INTO "user_sessions" VALUES(101,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','M92thGpujgkHRQA_uUcrNtYIPJrfSdI8pAYXuRb_5Qc','127.0.0.1','python-requests/2.31.0',1,'2025-08-13 08:34:50.678135','2025-08-12 08:34:50','2025-08-12 08:34:50');
INSERT INTO "user_sessions" VALUES(102,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','5_cbz9ZqHYqTQJrfQFAkhYXt1GmtwJAYsij1kgbeG_E','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-14 10:23:44.075288','2025-08-13 10:23:44','2025-08-13 10:23:44');
INSERT INTO "user_sessions" VALUES(103,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','V511S3DrhFsaeydzbP8vsuDIhZXmWv0hpdtBO3RJyG8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-14 15:18:12.653571','2025-08-13 15:18:12','2025-08-13 15:18:12');
INSERT INTO "user_sessions" VALUES(104,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','lahzInFq9a4uqBzNhNi9914_XlfeayAyKATRxnz-p8s','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-17 12:29:02.644855','2025-08-16 12:29:02','2025-08-16 12:29:02');
INSERT INTO "user_sessions" VALUES(105,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','o8VZ1LEHpHNkwaOyBteBrvnFnJ6OQgAz65PvhnGr6mM','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-17 14:47:32.347973','2025-08-16 14:47:32','2025-08-16 14:47:32');
INSERT INTO "user_sessions" VALUES(106,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Y4GmnrstTYAukj1Yh-RKfFKb04HW3Gmirl4taYAENX8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-17 15:26:14.989607','2025-08-16 15:26:15','2025-08-16 15:26:15');
INSERT INTO "user_sessions" VALUES(107,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','8AGENBLmcuJrJWvQXO6GYvvmO0Hxnjn4JDSfIZdvq8M','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-17 15:59:47.573057','2025-08-16 15:59:47','2025-08-16 15:59:47');
INSERT INTO "user_sessions" VALUES(108,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','_SSzjoeaUVofwPZfJIRLMDFgOJGYbgHkYAN9q7tTxOk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-17 18:09:16.888525','2025-08-16 18:09:16','2025-08-16 18:09:16');
INSERT INTO "user_sessions" VALUES(109,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','t_S3gLVMDjKp-kIGPBRbPXDG8L1Z0xm4EcNkKwlWjv8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-17 18:40:58.778136','2025-08-16 18:40:58','2025-08-16 18:40:58');
INSERT INTO "user_sessions" VALUES(110,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','cktnTKKWG5YEYrpGwTVqrWUVGO0HdV-4JILs_t3ym_0','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-17 19:54:27.187798','2025-08-16 19:54:27','2025-08-16 19:54:27');
INSERT INTO "user_sessions" VALUES(111,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','tbxDGIN4CWz7sYjp5gD_jXL3fcMQk8jCwYr4MCCf_K8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-17 20:12:22.008579','2025-08-16 20:12:22','2025-08-16 20:12:22');
INSERT INTO "user_sessions" VALUES(112,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','TdUgSsoAVtVGiEY5JZsPkKkCavjsMC-keeFnwCZfOes','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 04:43:29.355051','2025-08-17 04:43:29','2025-08-17 04:43:29');
INSERT INTO "user_sessions" VALUES(113,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','G-Ojf2bgoZXB8M1MNQAlDlaIIDKGlC4sxFAvyfIJudI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 04:48:35.185909','2025-08-17 04:48:35','2025-08-17 04:48:35');
INSERT INTO "user_sessions" VALUES(114,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','OKKysroitS2FT4VJY5GjSkEYrow23BDrAKMwTA13y1E','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-18 04:54:01.760013','2025-08-17 04:54:01','2025-08-17 04:54:01');
INSERT INTO "user_sessions" VALUES(115,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','bdcute75005VEd1OIi8j88Q9IlANhjoYc9Vamd29pWI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-18 05:29:35.709381','2025-08-17 05:29:35','2025-08-17 05:29:35');
INSERT INTO "user_sessions" VALUES(116,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','_OCSRjymPlXKeWuzKbvO5b94PBvhoceRDdejBdVRMWI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-18 05:29:37.454870','2025-08-17 05:29:37','2025-08-17 05:29:37');
INSERT INTO "user_sessions" VALUES(117,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','391e_j62DaRj3lzuXi1186s4hLfCyZXzl9_tBrWLaGw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 12:04:23.757723','2025-08-17 12:04:23','2025-08-17 12:04:23');
INSERT INTO "user_sessions" VALUES(118,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','-9HuKUvV8Hoxl-K2dNRYB-IZMoVDgbfNpWRkpm_ikX4','127.0.0.1','python-requests/2.31.0',1,'2025-08-18 12:24:03.719810','2025-08-17 12:24:03','2025-08-17 12:24:03');
INSERT INTO "user_sessions" VALUES(119,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','1XW7HGiBcLTGXHK2ZhkQMFbrlaGXQfBM4OZO8-H5u2U','127.0.0.1','python-requests/2.31.0',1,'2025-08-18 12:25:09.148122','2025-08-17 12:25:09','2025-08-17 12:25:09');
INSERT INTO "user_sessions" VALUES(120,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','XVUWfIzMNHV0pzTEjxUPfq6Prx3r0P62EnxtOT6i8Xo','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 12:36:00.847166','2025-08-17 12:36:00','2025-08-17 12:36:00');
INSERT INTO "user_sessions" VALUES(121,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Zc0FT0hH6t4nZ8xltusGCoaLJllsihir_oqdcij4-Xg','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 12:45:11.738195','2025-08-17 12:45:11','2025-08-17 12:45:11');
INSERT INTO "user_sessions" VALUES(122,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','PLR78kjqQN4xw7RwHm89xbIKcuVfBsZ34guviBd-wUk','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 12:46:20.079938','2025-08-17 12:46:20','2025-08-17 12:46:20');
INSERT INTO "user_sessions" VALUES(123,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','rIXD-Jr1OJ_z7hM9o8tMlyJibO-cy5fwSQ0ISaHnS3U','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 12:53:25.653488','2025-08-17 12:53:25','2025-08-17 12:53:25');
INSERT INTO "user_sessions" VALUES(124,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','i2PMMmDIDOw_Nq7hA8vAJgOibDaOBjzk_L5Qz23GKpE','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 12:56:46.423430','2025-08-17 12:56:46','2025-08-17 12:56:46');
INSERT INTO "user_sessions" VALUES(125,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','v8H641CuLzZOIIutZIKQtmfQsdqXcKZR3TtcLT3UzTk','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 13:00:41.610842','2025-08-17 13:00:41','2025-08-17 13:00:41');
INSERT INTO "user_sessions" VALUES(126,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','cla5dQmCngl9KtXVbVhHXOkPbbh76Q4EiV_ZwHw2jOc','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 13:03:00.211733','2025-08-17 13:03:00','2025-08-17 13:03:00');
INSERT INTO "user_sessions" VALUES(127,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','wcZDml2BJRIE-nTOFzmwlOZwB3rXR-b89UgAdEQ905o','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 13:03:55.446593','2025-08-17 13:03:55','2025-08-17 13:03:55');
INSERT INTO "user_sessions" VALUES(128,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','OzSP3sniT_4y3sq2yfcHomJrTiM8qHLCWkfWRM6aaJc','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 13:04:33.722630','2025-08-17 13:04:33','2025-08-17 13:04:33');
INSERT INTO "user_sessions" VALUES(129,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','cesbpwEJ3WGU2-zvR_zbJYG7nO8BK7ydF0NafAZWV7I','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 13:06:08.498780','2025-08-17 13:06:08','2025-08-17 13:06:08');
INSERT INTO "user_sessions" VALUES(130,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','rY0Q-6biiYpQgFWt_zFOTqQUJjRrFScSi38pZQqNj1A','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 14:13:15.215815','2025-08-17 14:13:15','2025-08-17 14:13:15');
INSERT INTO "user_sessions" VALUES(131,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','EldlsxoDZw8Ba3kEt-Mn2gbEfnIFhCgJMrH0K4f8Gkw','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 14:13:41.876362','2025-08-17 14:13:41','2025-08-17 14:13:41');
INSERT INTO "user_sessions" VALUES(132,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','gZaJf8AjTMbY2xhyug-sUpu2bfrt2NRb65m0eyBcU6w','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 14:15:11.930954','2025-08-17 14:15:11','2025-08-17 14:15:11');
INSERT INTO "user_sessions" VALUES(133,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','H-ZXQO0hRB5RPI0PnoXKGI4g3LFj_MtAAhaY46ob6pg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 19:09:50.338816','2025-08-17 19:09:50','2025-08-17 19:09:50');
INSERT INTO "user_sessions" VALUES(134,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','l8HXXxEMR8xZIFMh8w9MzEanHsczm2WZXg9mEktAOEQ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 19:10:51.423992','2025-08-17 19:10:51','2025-08-17 19:10:51');
INSERT INTO "user_sessions" VALUES(135,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','G7FDJXom3SwEemi3Tcooeo4krLRHZYdR3Rwn9hcI8TQ','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 19:21:10.597583','2025-08-17 19:21:10','2025-08-17 19:21:10');
INSERT INTO "user_sessions" VALUES(136,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','MRMHgwYgQyCXcAcJXD4KIyg8QPj3kANAjD3ZGYOkP_M','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 19:29:12.547228','2025-08-17 19:29:12','2025-08-17 19:29:12');
INSERT INTO "user_sessions" VALUES(137,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','H2YZbdvYkntBZOBr0Z2v6QEKjFT2I3MLyoTN1Z60mxM','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 19:31:24.715585','2025-08-17 19:31:24','2025-08-17 19:31:24');
INSERT INTO "user_sessions" VALUES(138,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','N4B21o0526cQjf6F_spY7sv_tYRbiGeXzi8SXZoviUc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 19:46:00.614336','2025-08-17 19:46:00','2025-08-17 19:46:00');
INSERT INTO "user_sessions" VALUES(139,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','mDRYpo9cSopyomZ4qFGmLfMMVJTK6sQaXZfpL4cVQ5M','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 19:48:41.504551','2025-08-17 19:48:41','2025-08-17 19:48:41');
INSERT INTO "user_sessions" VALUES(140,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','tv22jgoDOEjA85tzIcqWW9dl5UtV5fuS749Vl9a75uI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',1,'2025-08-18 19:51:55.123468','2025-08-17 19:51:55','2025-08-17 19:51:55');
INSERT INTO "user_sessions" VALUES(141,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','mAWSO_kIy2a5xfNY4WgNqwgLtSzLFpa5tteGPEKPFSU','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 20:11:38.171211','2025-08-17 20:11:38','2025-08-17 20:11:38');
INSERT INTO "user_sessions" VALUES(142,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','JPzXOkQ0R7Wf-NKdgyoZ9K-E8s85z52efrQS48HuSjY','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 20:26:14.374669','2025-08-17 20:26:14','2025-08-17 20:26:14');
INSERT INTO "user_sessions" VALUES(143,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','F6ox3mNRGHK8wK_asBdlBEhRuhtqriEXNvDYX0nyEs8','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 20:26:30.893048','2025-08-17 20:26:30','2025-08-17 20:26:30');
INSERT INTO "user_sessions" VALUES(144,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','IsncAVH0he8FuaH6eDS5OkLmOum9s41-Xd8cpjp_QMQ','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 20:26:48.292746','2025-08-17 20:26:48','2025-08-17 20:26:48');
INSERT INTO "user_sessions" VALUES(145,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','ooqFefb3tWUDb4IuXUjAIVcp_BtAYUyu0D4kr1WoJ6Q','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-18 20:27:06.955787','2025-08-17 20:27:06','2025-08-17 20:27:06');
INSERT INTO "user_sessions" VALUES(146,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','KljgeQcG8T2OjOpAHRm2eZWYciFKWIxXuaRuFpWzXds','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-19 06:59:25.539141','2025-08-18 06:59:25','2025-08-18 06:59:25');
INSERT INTO "user_sessions" VALUES(147,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','D8wA9CTiQKiDEATnUu0PcpvxRCkmG7S9kkinuHEjk7Y','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:04:47.607204','2025-08-18 07:04:47','2025-08-18 07:04:47');
INSERT INTO "user_sessions" VALUES(148,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','dMxDFh_9kgGbD2pt_i1KFGzHN61oUSpDWOqAqw1TV8k','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:05:57.235939','2025-08-18 07:05:57','2025-08-18 07:05:57');
INSERT INTO "user_sessions" VALUES(149,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','1_sl2DGv4NXs4_4sBMp9HD5LbtcoY5IuX0-6BM0iCio','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:08:54.092470','2025-08-18 07:08:54','2025-08-18 07:08:54');
INSERT INTO "user_sessions" VALUES(150,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','-ByHyEAKwimumHX-m7dfKD-xOmJ6NLlF_uecnrviCLc','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:09:19.074780','2025-08-18 07:09:19','2025-08-18 07:09:19');
INSERT INTO "user_sessions" VALUES(151,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','MoEyHygVG29a5Gr07xI834Nc0HjAXtXzg1r0tmSLDaI','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:12:46.004750','2025-08-18 07:12:46','2025-08-18 07:12:46');
INSERT INTO "user_sessions" VALUES(152,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','61zvm_FICwVPyVPOXpXRVgnq9dgJfUCp7BDb1aASc_s','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:13:10.526173','2025-08-18 07:13:10','2025-08-18 07:13:10');
INSERT INTO "user_sessions" VALUES(153,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','sKKpM8R1EzMPmLLrMHm-j52-83TY4llk0tS1jK3VS5c','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:14:06.048052','2025-08-18 07:14:06','2025-08-18 07:14:06');
INSERT INTO "user_sessions" VALUES(154,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','mWJn0Tgk3WHTeXlvfJpGUg4TTkMtlz4neGxkZ4b8Zx0','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:16:37.196285','2025-08-18 07:16:37','2025-08-18 07:16:37');
INSERT INTO "user_sessions" VALUES(155,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','crdH2JLMcpkF-EDVxn4jv9fNJhgL-CKVZG_k0n-irsE','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:18:05.371714','2025-08-18 07:18:05','2025-08-18 07:18:05');
INSERT INTO "user_sessions" VALUES(156,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','GrKoedXXN6nCXvcyyVCwNMOfwWesufFf7QPjb4ArYCU','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:21:05.238897','2025-08-18 07:21:05','2025-08-18 07:21:05');
INSERT INTO "user_sessions" VALUES(157,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','iAbY2Ybd1bneCgGu0fenk1g2XZcjRTv6pB3mBAKswhk','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:22:12.042914','2025-08-18 07:22:12','2025-08-18 07:22:12');
INSERT INTO "user_sessions" VALUES(158,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Vw13Yls4MZ-mIRbksWyQ8uCn5f3DvlP_ghasnoexMl8','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:22:52.530311','2025-08-18 07:22:52','2025-08-18 07:22:52');
INSERT INTO "user_sessions" VALUES(159,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','mxjuKECzOEJyZxkp4cnu_z5x2bz7R-poO-BKtSgaGek','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:24:13.905822','2025-08-18 07:24:13','2025-08-18 07:24:13');
INSERT INTO "user_sessions" VALUES(160,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','1-1uFiT6DJozzowqEcrQqm1jaK6E7kqu7ZSLgZb3lH0','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:25:00.302004','2025-08-18 07:25:00','2025-08-18 07:25:00');
INSERT INTO "user_sessions" VALUES(161,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','hiEBeRiBadPFLEFII2MEwag3OetwE5iJYnvGODIx7aA','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:25:41.019520','2025-08-18 07:25:41','2025-08-18 07:25:41');
INSERT INTO "user_sessions" VALUES(162,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','jlxtx8dDAI9whw4YVpFD-GzltARldp1gajTMm4uA_eI','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:26:11.832581','2025-08-18 07:26:11','2025-08-18 07:26:11');
INSERT INTO "user_sessions" VALUES(163,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','iIkABZmMTL5AghsrxSBDILL4IjymI1tfxisD6HQX1ko','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:27:00.870961','2025-08-18 07:27:00','2025-08-18 07:27:00');
INSERT INTO "user_sessions" VALUES(164,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','SxHj8llrQ2bJYtsqLIDb6EQmKFE1Ja77BM1VbtaNKSQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:31:14.331842','2025-08-18 07:31:14','2025-08-18 07:31:14');
INSERT INTO "user_sessions" VALUES(165,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','bLpZLHZl4kQ08fAL0rI_0nogFMVVX58liYRpBoMPCbc','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:32:30.267202','2025-08-18 07:32:30','2025-08-18 07:32:30');
INSERT INTO "user_sessions" VALUES(166,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','KWuiOdvin0yyMQYTFfWl-49MEgl7XmNCJzSCW5WDaIQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:33:52.453283','2025-08-18 07:33:52','2025-08-18 07:33:52');
INSERT INTO "user_sessions" VALUES(167,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Bef7drnC0X9fIfWQnXuBH-V_IhrBppCMjioaTbPUFm0','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 07:36:10.727302','2025-08-18 07:36:10','2025-08-18 07:36:10');
INSERT INTO "user_sessions" VALUES(168,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','9o3lQ158W6N6f4KqFNOAv2w5EoVyb09yMi4kYjMDGnQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:02:52.175244','2025-08-18 08:02:52','2025-08-18 08:02:52');
INSERT INTO "user_sessions" VALUES(169,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','EZTvv0xLYvj-efLAh6-WRf3R4SaVsHipABKGZMpqjpM','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:04:43.968102','2025-08-18 08:04:43','2025-08-18 08:04:43');
INSERT INTO "user_sessions" VALUES(170,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','IZbpBCZ0VzLufsIY2ibsbWy-EmuPLCKiWfJs8UWX0a4','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:05:34.275639','2025-08-18 08:05:34','2025-08-18 08:05:34');
INSERT INTO "user_sessions" VALUES(171,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','4nMbO8c62PS_f5l3XkL4MUfb8ZiCOMDUtLR1cvP2E0I','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:08:27.429747','2025-08-18 08:08:27','2025-08-18 08:08:27');
INSERT INTO "user_sessions" VALUES(172,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Z9dfUyvR3U81JcaDCxJX8ifXBF8Zo7GQi6f_b-LI80U','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:09:35.049756','2025-08-18 08:09:35','2025-08-18 08:09:35');
INSERT INTO "user_sessions" VALUES(173,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Kcyxhu-jJiQlWS9HkYgB8lOLz0EV4DiEU8b0RxZGGVY','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:48:50.696857','2025-08-18 08:48:50','2025-08-18 08:48:50');
INSERT INTO "user_sessions" VALUES(174,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','wUojJ6Dj9ypR83qgvFZ80wHUmoqgCfZRGAwHVpvRMno','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:50:30.776039','2025-08-18 08:50:30','2025-08-18 08:50:30');
INSERT INTO "user_sessions" VALUES(175,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','NAUoG6nI0c8Wk19PF1bsO2C7UFpz3rgIEXcVFMOXIU0','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 08:53:42.068387','2025-08-18 08:53:42','2025-08-18 08:53:42');
INSERT INTO "user_sessions" VALUES(176,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','UMyBhPjDODSBm1q6b_36isCUDV7OAXDNRiraYpaBzY8','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:08:10.232107','2025-08-18 09:08:10','2025-08-18 09:08:10');
INSERT INTO "user_sessions" VALUES(177,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','YamubGFUvOAILn8LXF24ssNOToBL54Y8qDNb9wdBEUw','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:09:59.261827','2025-08-18 09:09:59','2025-08-18 09:09:59');
INSERT INTO "user_sessions" VALUES(178,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','LxQMgYjIzqe4cNXK3peIzFhHzmoNsL7aW1v6DEydGXU','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:11:00.420429','2025-08-18 09:11:00','2025-08-18 09:11:00');
INSERT INTO "user_sessions" VALUES(179,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','opl_vV6NPWtHwcIPJ_7vczsai4n3o2GbV1I_ZL_LUAk','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:12:19.751016','2025-08-18 09:12:19','2025-08-18 09:12:19');
INSERT INTO "user_sessions" VALUES(180,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','6qETTlbwZGfBwmGQqg12AEKiBmF5LxWU4s7eKYx1N58','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:13:01.425114','2025-08-18 09:13:01','2025-08-18 09:13:01');
INSERT INTO "user_sessions" VALUES(181,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','OgjxsWaV53jiL2C04WvkMgnh5jD-6HTCYgm3n39nPOY','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:16:21.523265','2025-08-18 09:16:21','2025-08-18 09:16:21');
INSERT INTO "user_sessions" VALUES(182,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','M7vtG2uuS3g58Jo0Ru35nFBbPTVkx6Uqg8jtkhuSf50','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:17:16.787234','2025-08-18 09:17:16','2025-08-18 09:17:16');
INSERT INTO "user_sessions" VALUES(183,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','SRayH-PpvoWcEEIC4CtsueOBzUrmmxqVibl9ckMfJ9w','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:18:22.540394','2025-08-18 09:18:22','2025-08-18 09:18:22');
INSERT INTO "user_sessions" VALUES(184,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','J7FZ2Y1x4cqs30W_u6aNyhlJhKySrL9kEffQKyh7tVw','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:18:48.655696','2025-08-18 09:18:48','2025-08-18 09:18:48');
INSERT INTO "user_sessions" VALUES(185,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','COYkiKYdFTRQWJsu0btfqGIpQEgWUvNRa4nr4jWlNf0','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:19:39.212454','2025-08-18 09:19:39','2025-08-18 09:19:39');
INSERT INTO "user_sessions" VALUES(186,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','z38ybbkgQvdRgYThJDNUzsfAPy1ub94AHZ3OQnWVA_4','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-19 09:24:04.014999','2025-08-18 09:24:04','2025-08-18 09:24:04');
INSERT INTO "user_sessions" VALUES(187,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','5Rit6A6-VrI93w3wSabYtLqGJ9QWY_dLMr4YnkwuukM','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:29:03.149925','2025-08-18 09:29:03','2025-08-18 09:29:03');
INSERT INTO "user_sessions" VALUES(188,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','3Q68TWIbVuaQH9Xz6C0VydhAgVTm5RtfpwrUYeQ3-VY','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:30:54.489825','2025-08-18 09:30:54','2025-08-18 09:30:54');
INSERT INTO "user_sessions" VALUES(189,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','kcdWraXqKGLTihaBnSLB7hE7zXzHZJlU2wqYPsdCHOg','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:31:47.731508','2025-08-18 09:31:47','2025-08-18 09:31:47');
INSERT INTO "user_sessions" VALUES(190,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','1eaBeGOM17R6RHux0py-wRy7pn1BSKF7ElR-13N0P40','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:32:42.495503','2025-08-18 09:32:42','2025-08-18 09:32:42');
INSERT INTO "user_sessions" VALUES(191,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','MQkaSAkUXeEwfgsXtSfzxmvwPM6J3L5-2PhjT98XnYQ','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:33:24.244774','2025-08-18 09:33:24','2025-08-18 09:33:24');
INSERT INTO "user_sessions" VALUES(192,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','GluRdWvD2mHSqk7I4L_rv9d2h8U51sCSx9wvSvyO56A','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:48:32.464358','2025-08-18 09:48:32','2025-08-18 09:48:32');
INSERT INTO "user_sessions" VALUES(193,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','DAVqqu0FqLTFFbPIgdZ8GqEt-SnMJcuMy4c67r_wA2Q','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:50:12.589667','2025-08-18 09:50:12','2025-08-18 09:50:12');
INSERT INTO "user_sessions" VALUES(194,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','1C33BhAHm7JNCeZuwWNGXI5QQcETaT7TPt0Z9JLwrZc','127.0.0.1','python-requests/2.31.0',1,'2025-08-19 09:51:26.366230','2025-08-18 09:51:26','2025-08-18 09:51:26');
INSERT INTO "user_sessions" VALUES(195,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','J0A4zBwaL9vk5E40fR66LGg02x0kBftj3QQP2izg20E','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-21 06:45:50.527651','2025-08-20 06:45:50','2025-08-20 06:45:50');
INSERT INTO "user_sessions" VALUES(196,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','st07PjntiLytTc4_hFTYBl1i72XKN42OMAI5fokQf9k','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-21 09:08:51.976923','2025-08-20 09:08:52','2025-08-20 09:08:52');
INSERT INTO "user_sessions" VALUES(197,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','VkEM3wroWfgu-sl73YJiR21bwlKCOkM3RYlZdct5MOc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-21 12:48:21.905821','2025-08-20 12:48:21','2025-08-20 12:48:21');
INSERT INTO "user_sessions" VALUES(198,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','04R9TRj6SLGJaMGJQJnOor32xohlgkzqAJYuNVUMzEI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-21 12:53:57.261898','2025-08-20 12:53:57','2025-08-20 12:53:57');
INSERT INTO "user_sessions" VALUES(199,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','rvGORx_Yz82PE2vTqS2NXsFKTLwTk_aJrx8GbhLLEXA','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-21 16:40:11.865496','2025-08-20 16:40:12','2025-08-20 16:40:12');
INSERT INTO "user_sessions" VALUES(200,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','tPLBKGOLFVXCN0jxxNwwh89rTRolIJi3cVF5fEPSuY8','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-21 19:12:21.285832','2025-08-20 19:12:21','2025-08-20 19:12:21');
INSERT INTO "user_sessions" VALUES(201,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','prIaEEwF-PX_94imS_TyXPb1jPBrWZl0mV6eqlmTUHQ','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.4768',1,'2025-08-21 19:12:46.198754','2025-08-20 19:12:46','2025-08-20 19:12:46');
INSERT INTO "user_sessions" VALUES(202,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','Np_m2FVpYPjKgb6n87gXufkm3lCscJevKdk7SlOuWcU','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-22 08:59:44.785836','2025-08-21 08:59:44','2025-08-21 08:59:44');
INSERT INTO "user_sessions" VALUES(203,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','vad5qmdEqeKCh-6SLF0hWzco__AL0baLLq2Lg0gkv1k','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-22 11:08:37.148547','2025-08-21 11:08:37','2025-08-21 11:08:37');
INSERT INTO "user_sessions" VALUES(204,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','uAJ8Is9axdyRYm18myAyA3K2FMp3wbi1zKMyXLnWCpo','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-22 11:17:43.884577','2025-08-21 11:17:43','2025-08-21 11:17:43');
INSERT INTO "user_sessions" VALUES(205,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','8E1_GrDw5KZPM4UYccE1N2FA-Oj24q8D9IoGlh6iq7A','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-22 13:10:56.668868','2025-08-21 13:10:56','2025-08-21 13:10:56');
INSERT INTO "user_sessions" VALUES(206,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','z_6VU-8KGajXzEdRg0xuwd3WEmaNrSipBO2tzXTeNpw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-22 15:39:36.520009','2025-08-21 15:39:36','2025-08-21 15:39:36');
INSERT INTO "user_sessions" VALUES(207,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','NVH5DOkEcmjgZ6Ai6sifUNcyaIMaZi7DH9Y5nfSnHgs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-22 17:43:41.566927','2025-08-21 17:43:41','2025-08-21 17:43:41');
INSERT INTO "user_sessions" VALUES(208,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','hRi2roKS5IIoRrJoHCSm-sf8UFqanc4iqIQKOO4SgWs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-23 03:34:14.670893','2025-08-22 03:34:14','2025-08-22 03:34:14');
INSERT INTO "user_sessions" VALUES(209,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','jSLsu5BG_5cZfPhkYOtTe-GENd9n-S1EqbCCstK80AU','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.100.3 Chrome/132.0.6834.210 Electron/34.5.1 Safari/537.36',1,'2025-08-23 03:55:43.474944','2025-08-22 03:55:43','2025-08-22 03:55:43');
INSERT INTO "user_sessions" VALUES(210,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','zcaV7tbpOpuRNwbpcEuZuF7oJN0ROMtd8QGoqmExoJg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-23 06:19:41.418287','2025-08-22 06:19:41','2025-08-22 06:19:41');
INSERT INTO "user_sessions" VALUES(211,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','StnwfsJcGRWwpYCnlYFuRLXIf4wf9yXzk9iq-Ky3bcs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-23 09:25:36.123116','2025-08-22 09:25:36','2025-08-22 09:25:36');
INSERT INTO "user_sessions" VALUES(212,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','DkLQI51ObvWqzr7r72GrpKFNT6g4Cn2NNQ9WbyUwv94','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-24 12:43:33.851513','2025-08-23 12:43:33','2025-08-23 12:43:33');
INSERT INTO "user_sessions" VALUES(213,'4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','T_NI3_X9vzw3RsiSVp2X7qNXkhFujjuaVyUho_Eb7Lw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',1,'2025-08-26 05:37:22.581206','2025-08-25 05:37:22','2025-08-25 05:37:22');
CREATE TABLE "users" (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255), 
	first_name VARCHAR(100) NOT NULL, 
	last_name VARCHAR(100) NOT NULL, 
	phone VARCHAR(20), 
	role VARCHAR(11) NOT NULL, 
	is_active BOOLEAN, 
	is_verified BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	clerk_user_id VARCHAR(255), 
	PRIMARY KEY (id), 
	CONSTRAINT uq_users_clerk_user_id UNIQUE (clerk_user_id), 
	UNIQUE (email)
);
INSERT INTO "users" VALUES('4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924','admin@remotehive.in','$2b$12$SqU7O7H.j9DP1vLBxFdXfeiGFnUy1p1.rkCMdiFqJZSC9p8lBioTS','Super','Admin',NULL,'SUPER_ADMIN',1,1,'2025-08-05 06:04:56','2025-08-05 06:31:08',NULL);
INSERT INTO "users" VALUES('37251a0c-56cd-4a0c-9c0d-1f897c0d0c57','system@remotehive.com','dummy_hash','System','Admin',NULL,'ADMIN',1,1,'2025-08-05 06:07:38','2025-08-05 06:07:38',NULL);
INSERT INTO "users" VALUES('8074f8f2-890c-42ea-b158-9ba36aaa3dcf','ranjeettiwary589@gmail.com','$2b$12$sYiiz9W668hRiWUeGD.YK.XZawHShDJ2FegS/AYLQmzZHPccmD.hy','Ranjeet','Tiwary',NULL,'EMPLOYER',1,0,'2025-08-06 09:55:20','2025-08-06 09:55:20',NULL);
INSERT INTO "users" VALUES('0a535dc1-0460-4871-80ea-e3d0dc12bb16','test@example.com','$2b$12$SuDZb20516dmaFrbx2BpHOtfoI6VIDcmAa2FnmaMG0AzjFsj9cQhO','Test','User',NULL,'EMPLOYER',1,0,'2025-08-06 10:11:12','2025-08-06 10:11:12',NULL);
INSERT INTO "users" VALUES('cd424941-9bed-4ea1-8c32-9db721115b88','jobseeker@example.com','$2b$12$TCl1gzebQGP84gSqggRdIuFO3dauOwRRvHZo3UracY1FRTuF6CTa2','Jane','Seeker',NULL,'JOB_SEEKER',1,0,'2025-08-06 10:11:30','2025-08-06 10:11:30',NULL);
INSERT INTO "users" VALUES('a2ecbb19-c762-42c8-abdc-3860bef6aec2','newemployer@example.com','$2b$12$UY34EaW5pmmPsUA8WcAW1OxfNOLmTVnFbQ2smM.MuGWeMU633Ug/W','New','Employer','+1234567890','EMPLOYER',1,0,'2025-08-06 10:15:57','2025-08-06 10:15:57',NULL);
INSERT INTO "users" VALUES('33595c1f-8437-445b-ac3a-4c67ab6128d0','newjobseeker@example.com','$2b$12$0265SFfW8M3wroHWgsI4d.ajZXnFI3c8iG8zgud3WXQHKhMBbN2A.','New','JobSeeker','+1234567891','JOB_SEEKER',1,0,'2025-08-06 10:16:12','2025-08-06 10:16:12',NULL);
INSERT INTO "users" VALUES('0303d341-cf59-4cc5-9dfb-3eeae4a600d7','testemployer2@example.com','$2b$12$sNVJ4RmS0011yUxzmN0AEO39eI5.Kqf4FhaEDcdDAedR9DNYaer/q','Test','Employer2','+1234567892','EMPLOYER',1,0,'2025-08-06 10:17:58','2025-08-06 10:17:58',NULL);
INSERT INTO "users" VALUES('c7fad14b-34ec-46d5-92a0-8212896724dd','finaltest@example.com','$2b$12$9eHfa/ZwGEZ2QgpNLgvIN.Rzdm2K4CeH49WHa0pghisL4hEdjpJQ.','Final','Test','+1234567893','EMPLOYER',1,0,'2025-08-06 10:20:22','2025-08-06 10:20:22',NULL);
INSERT INTO "users" VALUES('a16eeb22-fa42-4d0b-8d41-aff0b73e0d38','uniquetest@example.com','$2b$12$XsKNLgC9S9vVZ56BqXXRie3w4K86IjEWMRuW/QmhXqsTxj0vCTeuK','Unique','Test','+1234567894','EMPLOYER',1,0,'2025-08-06 10:20:51','2025-08-06 10:20:51',NULL);
INSERT INTO "users" VALUES('74c4c34c-e456-47b6-a073-24b5dcaeafb5','testfinal@example.com','$2b$12$cu.jBP6JnLMJjkZEgQlnO.0Shg84iAQKKkwaHa0G3MvuTQ8sVOAUq','Test','Final','+1234567895','EMPLOYER',1,0,'2025-08-06 10:24:39','2025-08-06 10:24:39',NULL);
INSERT INTO "users" VALUES('755ae7e6-6962-422a-a347-c1105f94ebcf','testjobseeker@example.com','$2b$12$hrGDPsLhterza4o7F5GWGOLLcnkkNVOusxiekoYZ3ZZEPvJLa2MP.','Test','JobSeeker','+1234567896','JOB_SEEKER',1,0,'2025-08-06 10:26:19','2025-08-06 10:26:19',NULL);
INSERT INTO "users" VALUES('82e2c206-efd7-4443-a3f5-a09289c8f715','debugtest@example.com','$2b$12$.dKtgsoRoVZmBGOSgbjn7eRIT5s4aMTqWIHD9PAumnBneIqTQvFhu','Debug','Test','+1234567897','EMPLOYER',1,0,'2025-08-06 10:29:12','2025-08-06 10:29:12',NULL);
INSERT INTO "users" VALUES('84150151-50a0-459d-bd8c-7da44805d32d','finaltest2@example.com','$2b$12$aqPkAIMlCdF7H.jpZH5BJuy9kXVVcoCkpTSXHqnuOKkobt/w35Xlu','Final','Test2','+1234567898','EMPLOYER',1,0,'2025-08-06 10:29:53','2025-08-06 10:29:53',NULL);
INSERT INTO "users" VALUES('4d3a3eef-17fa-4557-b539-8e25b20d5a2d','endpointtest@example.com','$2b$12$xtm1MzWBnXu0MrZCh.CZpuAPmya077b/0fc3tFLtafiRF41lwnAxe','Endpoint','Test','+1234567899','EMPLOYER',1,0,'2025-08-06 10:31:44','2025-08-06 10:31:44',NULL);
INSERT INTO "users" VALUES('e547bb3e-5f25-43c4-be36-38eab8459a5c','jobseekertest@example.com','$2b$12$drJ41ubaN2Cr0U0u87Sna.fuZ4jP.HOZbygwKBoCXJUvkux/saIwy','JobSeeker','Test','+1234567900','JOB_SEEKER',1,0,'2025-08-06 10:33:42','2025-08-06 10:33:42',NULL);
INSERT INTO "users" VALUES('560c4a9f-4651-4143-ab57-b5c67a46b727','debugtest2@example.com','$2b$12$EpiCFcEnInXCPWDUgwwES.iwEuxNbS6D02vXIg.q2AGsO9MzVyxtS','Debug','Test2','+1234567902','JOB_SEEKER',1,0,'2025-08-06 10:41:28','2025-08-06 10:41:28',NULL);
INSERT INTO "users" VALUES('a89ef338-fa84-4061-9e65-bc1d6feaaf19','debugtest3@example.com','$2b$12$p9ioJmEeANLj8Vali/4dkufJUn4ua3Y2kZW.nc6718wszKQkwvgXu','Debug','Test3','+1234567903','JOB_SEEKER',1,0,'2025-08-06 10:42:44','2025-08-06 10:42:44',NULL);
INSERT INTO "users" VALUES('300cd0b0-0613-4fbf-9321-cac4fe90b98a','debugtest4@example.com','$2b$12$GzLYGpIuL62wdRc9G0jRBuW.c.gkM3fce6J08KEUNIOmGS2mPL/aK','Debug','Test4','+1234567904','JOB_SEEKER',1,0,'2025-08-06 10:44:06','2025-08-06 10:44:06',NULL);
INSERT INTO "users" VALUES('87c07634-98b7-4598-8c4e-303a1f325774','debugtest5@example.com','$2b$12$ro1IT1QwJi1ST8JKjfnJJuC2QoxEwpqzg8J1qJ2cwvosUcQ3TunrW','Debug','Test5','+1234567905','JOB_SEEKER',1,0,'2025-08-06 10:45:04','2025-08-06 10:45:04',NULL);
INSERT INTO "users" VALUES('83140fca-c869-4c60-b949-6c71f1ddf491','debugtest6@example.com','$2b$12$/ULwer1qD/miw29UR2SMJeWrprSJ1F8rrltmepmgOAbYjZlNBOmGS','Debug','Test6','+1234567906','JOB_SEEKER',1,0,'2025-08-06 10:46:15','2025-08-06 10:46:15',NULL);
INSERT INTO "users" VALUES('2c4126a1-d051-4979-8bb9-486355f1f83c','debugtest7@example.com','$2b$12$Am5Ykb7sJJjWOYpnGw0qg.Bp4JcyrYeIqRPUwRL/ZhTYEgQprpN3C','Debug','Test7',NULL,'JOB_SEEKER',1,0,'2025-08-06 10:48:34','2025-08-06 10:48:34',NULL);
INSERT INTO "users" VALUES('2a8ce482-9ebf-47ea-ac44-8401dc4837bc','debugtest8@example.com','$2b$12$blJX3fhvveybeOQajrJJW.3QOW1jkkzbZG5oYkoWHG8nNctvhm3cq','Debug','Test8',NULL,'JOB_SEEKER',1,0,'2025-08-06 10:49:46','2025-08-06 10:49:46',NULL);
INSERT INTO "users" VALUES('5c12bce6-43e8-4639-88f6-61f5c9f1f1cb','debugtest9@example.com','$2b$12$eKFoxtKOAoAfNP2mbFhyH.IQ0PeCZWW/Nbaqazxp7qJ8yA9DChgEK','Debug','Test9',NULL,'JOB_SEEKER',1,0,'2025-08-06 10:53:09','2025-08-06 10:53:09',NULL);
INSERT INTO "users" VALUES('bb99bcc5-3c74-4681-b1f6-f7756b256c58','debugtest10@example.com','$2b$12$80RPa8AkDpnlj2gh7CuSxu023JLIm/onXnx155tUqSlvkYXi783yK','Debug','Test10',NULL,'JOB_SEEKER',1,0,'2025-08-06 10:54:03','2025-08-06 10:54:03',NULL);
INSERT INTO "users" VALUES('4ebfdb54-0af4-4763-9ef3-3650ce1ce013','debugtest11@example.com','$2b$12$6k61JVo6k3j3rUldvKsA4OaSDNW1BTJ3NiqKnlEdihHH6LCWceuya','Debug','Test11',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:00:55','2025-08-06 11:00:55',NULL);
INSERT INTO "users" VALUES('cb955639-2b09-470a-bc35-fe7495678acd','debugtest12@example.com','$2b$12$Aj.4xK5QMHgyQFTjRtsMzeeMR6uOJZuIRerFnpE1dgjTplHIuxdG6','Debug','Test12',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:02:47','2025-08-06 11:02:47',NULL);
INSERT INTO "users" VALUES('a676f527-ade6-4844-abac-de3fa532f88b','debugtest13@example.com','$2b$12$Qhyjz.1WZNmjor7i2Z2sh.V60rpiZwVJsCDWihlzp/Ab1lzIVyT.m','Debug','Test13',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:06:35','2025-08-06 11:06:35',NULL);
INSERT INTO "users" VALUES('46204da8-0e68-4d30-8c6e-922ac7fff306','testuser4@example.com','$2b$12$vp/Poy0uQs95ph3mZrpd1O1zwOz3MIKgJl65YMWyeBBLUUxFtPOc6','Test','User4',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:09:47','2025-08-06 11:09:47',NULL);
INSERT INTO "users" VALUES('80e25b5b-80ee-49e0-b44f-da91d55dc42e','directtest@example.com','$2b$12$VZD/0F75fTPzDubnMeNYI.LSTRBtBSeJdWul4zcbij5IURXawAuKq','Direct','Test',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:11:17','2025-08-06 11:11:17',NULL);
INSERT INTO "users" VALUES('a8098aae-717c-4720-8b22-8200aff1578e','reloadtest@example.com','$2b$12$wVYOvLKR9SRL1M64/QE0eeNfazT1QclELak1meLMMoDjT5drqRi9K','Reload','Test',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:13:21','2025-08-06 11:13:21',NULL);
INSERT INTO "users" VALUES('aa0460b2-a6bb-45fd-af76-7d06d84c18fc','test_correct_endpoint@example.com','$2b$12$D.DtxJ72hTW/./A5PEUlo.38gcPQCtlMXwekj4NqejjR6c3aQdMGu','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:14:40','2025-08-06 11:14:40',NULL);
INSERT INTO "users" VALUES('2fc00047-9f54-4fdc-9fc7-6582e134d411','test123@example.com','$2b$12$ieYCBg5iXc/.X/U42tJeNOH5NpLAw5TOs6kJhESe3lwXwO1mbYlQC','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:27:07','2025-08-06 11:27:07',NULL);
INSERT INTO "users" VALUES('eddcb528-2b72-42cf-8e2d-9c26739134cf','test456@example.com','$2b$12$EJMNgcDDcxWxBgJNSxhTaebsmRGSZcM7HuLDzY2hhhxWeZ.aFMi42','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:29:11','2025-08-06 11:29:11',NULL);
INSERT INTO "users" VALUES('d5e0b3d5-8c17-464a-8d46-990d8050aff6','test789@example.com','$2b$12$.R8LzKmbXD.bp48sY4mlj.gwsDix1bW9..7zQD7KtByOXpfWvvkRC','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:30:03','2025-08-06 11:30:03',NULL);
INSERT INTO "users" VALUES('c9db77a8-14ad-46f9-b0d5-00c8ee189786','testunique999@example.com','$2b$12$E8mHXL/5eflil6dwqfYgguhDbAvFYKiu6vSEKumUauRXbO2QNd86q','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:35:39','2025-08-06 11:35:39',NULL);
INSERT INTO "users" VALUES('2555b5d3-6949-46d5-aa54-ddab797ca97e','testfinal2@example.com','$2b$12$v7IytlkLixByiRY321HrwebVH6K1Uq3047tIdTJ6LdEvC9fqAsG7K','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:39:14','2025-08-06 11:39:14',NULL);
INSERT INTO "users" VALUES('dd2096d7-3cda-489f-be3d-c8a8b6012d84','testdebug123@example.com','$2b$12$uk20wYzpzGYPJoYhc/mgfOKmYZ9pf2wS0YJ0soSdGDllXyVjEHI6.','Test','User',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:41:36','2025-08-06 11:41:36',NULL);
INSERT INTO "users" VALUES('b4a2738d-0084-4fd7-9240-e2d10eeab357','testenhanced@example.com','$2b$12$WMjXqeMTn7xhXokfHRdXoud/ZcJbWPrZIFPu1lsYnl6JYyNiVTQTe','Test','Enhanced',NULL,'JOB_SEEKER',1,0,'2025-08-06 11:44:28','2025-08-06 11:44:28',NULL);
INSERT INTO "users" VALUES('0d84888f-fd8a-419b-b02d-89fa0f08b84c','testuser123@example.com','$2b$12$fgPSZfA.hmRK8SPHGmA1y.uTmrv2eiEkJesCHrgRUSkf/lDaypaMy','Test','User','+1234567890','JOB_SEEKER',1,0,'2025-08-06 12:03:45','2025-08-06 12:03:45',NULL);
INSERT INTO "users" VALUES('b616fd53-b775-4784-8436-6a33302b4bdb','ranjeet@gmail.com','$2b$12$Fl1/qh1BB.QSrW4.eD9BzOsvt4iVnsj97jJoCYHikyX1NkDN0sErm','Ranjeet','Tiwary',NULL,'EMPLOYER',1,0,'2025-08-06 16:34:02','2025-08-06 16:34:02',NULL);
INSERT INTO "users" VALUES('dc8d7f97-6dd2-4f37-99b0-21476bf33156','ranjeettiwari105@gmail.com','$2b$12$61cqSVTGlPZTa6RU/jOaMe8L458jAxQNZxvnVFQqKaH8md8QcvpJG','Ranjeet','Tiwary',NULL,'JOB_SEEKER',1,0,'2025-08-07 04:41:57','2025-08-07 04:41:57',NULL);
INSERT INTO "users" VALUES('93d0acb9-1559-42fc-95d3-bed8b80a0c6f','test.employer2@example.com',NULL,'John','Doe',NULL,'EMPLOYER',1,0,'2025-08-07 12:14:19','2025-08-07 12:14:19','user_30xUkLsaNJzDfdRaZXFsZDFdETS');
INSERT INTO "users" VALUES('3a0438d9-afb0-49fd-b568-facfb018e5b7','test.jobseeker@example.com',NULL,'Jane','Smith',NULL,'JOB_SEEKER',1,0,'2025-08-07 12:14:33','2025-08-07 12:14:33','user_30xUm8iyQRLUphGmkTrG8kShw65');
INSERT INTO "users" VALUES('967a82e2-83ba-4267-952c-361eef927bfc','testjobseeker@demo.com','$2b$12$o9DOYD6RAEPuslkaojXfputrx1w6bInjw5Kay4xpVHMqKcuphrK3W','Test','JobSeeker',NULL,'JOB_SEEKER',1,0,'2025-08-11 21:11:25','2025-08-11 21:11:25',NULL);
INSERT INTO "users" VALUES('ebcb22ba-4404-4b8a-833e-714168e7d91f','newjobseeker@demo.com','$2b$12$MpYncnQGIJ7OP21nhB0hle3g6/h/f.cQBFRyx03CkbjVEcTTK4qfK','New','JobSeeker',NULL,'JOB_SEEKER',1,0,'2025-08-11 21:17:13','2025-08-11 21:17:13',NULL);
INSERT INTO "users" VALUES('1469e4db-899e-497c-813a-5be73a8b4c1a','newemployer@demo.com','$2b$12$37HfbUDJ5NNE0SRv4/mjLe0lCjnxQIm7NWG8VTR71fA17EGWn/XGO','New','Employer',NULL,'EMPLOYER',1,0,'2025-08-12 05:09:18','2025-08-12 05:09:18',NULL);
CREATE INDEX ix_email_users_id ON email_users (id);
CREATE UNIQUE INDEX ix_email_users_email ON email_users (email);
CREATE INDEX ix_email_messages_id ON email_messages (id);
CREATE INDEX ix_email_messages_from_email ON email_messages (from_email);
CREATE INDEX ix_email_messages_to_email ON email_messages (to_email);
CREATE INDEX ix_email_folders_id ON email_folders (id);
CREATE INDEX ix_email_signatures_id ON email_signatures (id);
CREATE INDEX ix_email_attachments_id ON email_attachments (id);
CREATE INDEX idx_scraper_state_status ON scraper_state (status);
CREATE INDEX idx_scraper_state_config_id ON scraper_state (scraper_config_id);
CREATE INDEX idx_ml_parsing_config_enabled ON ml_parsing_config (is_enabled);
CREATE INDEX idx_analytics_metrics_config_id ON analytics_metrics (scraper_config_id);
CREATE INDEX idx_analytics_metrics_created_at ON analytics_metrics (created_at);
CREATE INDEX idx_scheduler_jobs_active ON scheduler_jobs (is_active);
CREATE INDEX idx_scheduler_jobs_next_run ON scheduler_jobs (next_run);
CREATE INDEX idx_csv_import_log_status ON csv_import_log (status);
CREATE INDEX idx_csv_import_log_user_id ON csv_import_log (user_id);
CREATE INDEX idx_csv_imports_user_id ON csv_imports (user_id);
CREATE INDEX idx_csv_imports_status ON csv_imports (status);
CREATE INDEX idx_csv_imports_created_at ON csv_imports (created_at);
CREATE INDEX idx_csv_import_logs_upload_id ON csv_import_logs (upload_id);
CREATE INDEX idx_csv_import_logs_status ON csv_import_logs (status);
CREATE INDEX idx_csv_import_logs_row_number ON csv_import_logs (row_number);
CREATE INDEX idx_managed_websites_active ON managed_websites(is_active);
CREATE INDEX idx_managed_websites_priority ON managed_websites(priority DESC);
CREATE INDEX idx_managed_websites_success_rate ON managed_websites(success_rate DESC);
CREATE INDEX idx_memory_uploads_status ON memory_uploads(upload_status);
CREATE INDEX idx_memory_uploads_type ON memory_uploads(memory_type);
CREATE INDEX idx_memory_uploads_active ON memory_uploads(is_active);
CREATE INDEX idx_memory_uploads_user ON memory_uploads(uploaded_by);
CREATE INDEX idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX idx_scraping_sessions_priority ON scraping_sessions(priority DESC);
CREATE INDEX idx_scraping_sessions_started_by ON scraping_sessions(started_by);
CREATE INDEX idx_scraping_sessions_created_at ON scraping_sessions(created_at DESC);
CREATE INDEX idx_ml_training_data_website ON ml_training_data(website_id);
CREATE INDEX idx_ml_training_data_category ON ml_training_data(data_category);
CREATE INDEX idx_ml_training_data_validated ON ml_training_data(is_validated);
CREATE INDEX idx_ml_training_data_confidence ON ml_training_data(confidence_score DESC);
CREATE INDEX idx_scraping_metrics_type ON scraping_metrics(metric_type);
CREATE INDEX idx_scraping_metrics_session ON scraping_metrics(session_id);
CREATE INDEX idx_scraping_metrics_website ON scraping_metrics(website_id);
CREATE INDEX idx_scraping_metrics_period ON scraping_metrics(period_start, period_end);
CREATE INDEX idx_scraper_memory_scraper_name ON scraper_memory(scraper_name);
CREATE INDEX idx_scraper_memory_is_active ON scraper_memory(is_active);
CREATE INDEX idx_scraper_memory_usage_count ON scraper_memory(usage_count DESC);
CREATE INDEX idx_scraper_memory_created_at ON scraper_memory(created_at DESC);
CREATE TRIGGER update_scraper_memory_updated_at
                    AFTER UPDATE ON scraper_memory
                    FOR EACH ROW
                    BEGIN
                        UPDATE scraper_memory SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                    END;
CREATE INDEX ix_scraping_results_session_id ON scraping_results (session_id);
CREATE INDEX ix_scraping_results_id ON scraping_results (id);
CREATE INDEX ix_session_websites_session_id ON session_websites (session_id);
CREATE INDEX ix_session_websites_id ON session_websites (id);
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('scraper_memory',3);
COMMIT;
