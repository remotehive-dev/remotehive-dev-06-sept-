BEGIN TRANSACTION;
CREATE TABLE error_logs (
	id INTEGER NOT NULL, 
	error_type VARCHAR(100) NOT NULL, 
	error_message TEXT NOT NULL, 
	error_traceback TEXT, 
	url VARCHAR(1000), 
	website_id INTEGER, 
	session_id VARCHAR(36), 
	occurred_at DATETIME NOT NULL, 
	is_resolved BOOLEAN, 
	resolution_method VARCHAR(100), 
	resolved_at DATETIME, 
	html_content TEXT, 
	failed_selectors JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(website_id) REFERENCES websites (id), 
	FOREIGN KEY(session_id) REFERENCES scraping_sessions (session_id)
);
CREATE TABLE job_postings (
	id INTEGER NOT NULL, 
	job_id VARCHAR(64) NOT NULL, 
	title VARCHAR(300) NOT NULL, 
	company_name VARCHAR(200), 
	description TEXT, 
	requirements TEXT, 
	location_city VARCHAR(100), 
	location_country VARCHAR(100), 
	location_full VARCHAR(300), 
	salary_min FLOAT, 
	salary_max FLOAT, 
	salary_currency VARCHAR(10), 
	salary_period VARCHAR(20), 
	employment_type VARCHAR(50), 
	experience_level VARCHAR(50), 
	required_skills JSON, 
	application_url VARCHAR(1000), 
	application_deadline DATETIME, 
	source_url VARCHAR(1000) NOT NULL, 
	source_website VARCHAR(200) NOT NULL, 
	website_id INTEGER, 
	scraped_at DATETIME NOT NULL, 
	updated_at DATETIME, 
	is_active BOOLEAN NOT NULL, 
	raw_html TEXT, 
	extraction_confidence FLOAT, 
	PRIMARY KEY (id), 
	CONSTRAINT check_salary_min_positive CHECK (salary_min >= 0), 
	CONSTRAINT check_salary_max_greater CHECK (salary_max >= salary_min), 
	CONSTRAINT check_confidence_range CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1), 
	FOREIGN KEY(website_id) REFERENCES websites (id)
);
CREATE TABLE ml_models (
	id INTEGER NOT NULL, 
	model_id VARCHAR(36), 
	model_type VARCHAR(50) NOT NULL, 
	version VARCHAR(20) NOT NULL, 
	model_path VARCHAR(500), 
	training_data_size INTEGER, 
	training_accuracy FLOAT, 
	validation_accuracy FLOAT, 
	created_at DATETIME NOT NULL, 
	is_active BOOLEAN, 
	predictions_made INTEGER, 
	success_rate FLOAT, 
	hyperparameters JSON, 
	feature_importance JSON, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_model_type_version UNIQUE (model_type, version)
);
CREATE TABLE scraping_schedules (
	id INTEGER NOT NULL, 
	schedule_id VARCHAR(36), 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	website_ids JSON, 
	spider_name VARCHAR(100), 
	cron_expression VARCHAR(100), 
	interval_minutes INTEGER, 
	is_active BOOLEAN, 
	last_run_at DATETIME, 
	next_run_at DATETIME, 
	total_runs INTEGER, 
	successful_runs INTEGER, 
	created_at DATETIME NOT NULL, 
	created_by VARCHAR(100), 
	PRIMARY KEY (id)
);
CREATE TABLE scraping_sessions (
	id INTEGER NOT NULL, 
	session_id VARCHAR(36), 
	spider_name VARCHAR(100) NOT NULL, 
	website_id INTEGER, 
	started_at DATETIME NOT NULL, 
	completed_at DATETIME, 
	duration_seconds FLOAT, 
	jobs_found INTEGER, 
	jobs_extracted INTEGER, 
	jobs_saved INTEGER, 
	success_rate FLOAT, 
	pages_scraped INTEGER, 
	requests_made INTEGER, 
	errors_encountered JSON, 
	selector_updates_made INTEGER, 
	ml_patterns_learned INTEGER, 
	status VARCHAR(20), 
	PRIMARY KEY (id), 
	FOREIGN KEY(website_id) REFERENCES websites (id)
);
CREATE TABLE selector_patterns (
	id INTEGER NOT NULL, 
	website_id INTEGER NOT NULL, 
	field_name VARCHAR(50) NOT NULL, 
	selector VARCHAR(500) NOT NULL, 
	success_count INTEGER, 
	failure_count INTEGER, 
	confidence_score FLOAT, 
	created_at DATETIME NOT NULL, 
	last_used_at DATETIME, 
	is_active BOOLEAN, 
	learned_from_ml BOOLEAN, 
	human_verified BOOLEAN, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_website_field_selector UNIQUE (website_id, field_name, selector), 
	FOREIGN KEY(website_id) REFERENCES websites (id)
);
CREATE TABLE websites (
	id INTEGER NOT NULL, 
	website_id VARCHAR(50) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	base_url VARCHAR(500) NOT NULL, 
	country VARCHAR(100), 
	region VARCHAR(100), 
	job_listing_url VARCHAR(500), 
	is_active BOOLEAN NOT NULL, 
	requires_javascript BOOLEAN, 
	infinite_scroll BOOLEAN, 
	requests_per_minute INTEGER, 
	delay_between_requests FLOAT, 
	job_detail_selectors JSON, 
	custom_headers JSON, 
	user_agent_required VARCHAR(500), 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME, 
	last_scraped_at DATETIME, 
	total_jobs_scraped INTEGER, 
	success_rate FLOAT, 
	average_response_time FLOAT, 
	PRIMARY KEY (id)
);
INSERT INTO "websites" VALUES(1,'10up','10up','https://10up.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.786426','2025-08-25 05:34:23.786451',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(2,'15five','15Five','https://www.15five.com',NULL,'Europe, Americas',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789146','2025-08-25 05:34:23.789156',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(3,'17hats','17hats','https://www.17hats.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789352','2025-08-25 05:34:23.789360',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(4,'18f','18F','https://18f.gsa.gov/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789474','2025-08-25 05:34:23.789480',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(5,'1password','1Password','https://www.1password.com',NULL,'North America, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789575','2025-08-25 05:34:23.789581',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(6,'42_technologies','42 Technologies','https://www.42technologies.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789672','2025-08-25 05:34:23.789679',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(7,'abiturma','abiturma','https://www.abiturma.de/',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789778','2025-08-25 05:34:23.789785',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(8,'ably','Ably','https://www.ably.io/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.789902','2025-08-25 05:34:23.789914',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(9,'abstract_api','Abstract API','https://www.abstractapi.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790005','2025-08-25 05:34:23.790012',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(10,'acct','acct','https://acct.global',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790097','2025-08-25 05:34:23.790103',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(11,'acivilate','Acivilate','https://acivilate.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790197','2025-08-25 05:34:23.790204',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(12,'acquia','Acquia','https://www.acquia.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790290','2025-08-25 05:34:23.790297',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(13,'activecampaign','ActiveCampaign','https://www.activecampaign.com/',NULL,'Dublin, Ireland; USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790382','2025-08-25 05:34:23.790388',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(14,'ad_hoc','Ad Hoc','https://www.adhocteam.us/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790520','2025-08-25 05:34:23.790527',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(15,'adaface','Adaface','https://www.adaface.com',NULL,'Asia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790618','2025-08-25 05:34:23.790624',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(16,'addstructure','AddStructure','https://www.bazaarvoice.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790721','2025-08-25 05:34:23.790727',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(17,'adeva','Adeva','https://adevait.com/',NULL,'Asia, Africa, Europe, South America, USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790812','2025-08-25 05:34:23.790818',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(18,'adzuna','Adzuna','https://www.adzuna.co.uk/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790902','2025-08-25 05:34:23.790909',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(19,'ae_studio','AE Studio','https://ae.studio/',NULL,'USA, BR',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.790992','2025-08-25 05:34:23.790998',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(20,'aerolab','Aerolab','https://aerolab.co/',NULL,'Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791128','2025-08-25 05:34:23.791135',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(21,'aerostrat','Aerostrat','https://aerostratsoftware.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791224','2025-08-25 05:34:23.791230',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(22,'agflow','AgFlow','https://www.agflow.com',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791311','2025-08-25 05:34:23.791318',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(23,'aha','Aha!','https://www.aha.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791400','2025-08-25 05:34:23.791406',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(24,'aim_india','Aim India','https://www.aimincorp.com/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791489','2025-08-25 05:34:23.791495',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(25,'airbank','Airbank','https://www.joinairbank.com/',NULL,'Europe, Americas, Africa, Western Asia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791587','2025-08-25 05:34:23.791594',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(26,'airbyte','Airbyte','https://airbyte.com/',NULL,'Europe, North America, Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791716','2025-08-25 05:34:23.791722',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(27,'airgarage','AirGarage','https://www.airgarage.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791853','2025-08-25 05:34:23.791860',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(28,'airtreks','AirTreks','https://www.airtreks.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.791956','2025-08-25 05:34:23.791963',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(29,'aivitex','Aivitex','https://aivitex.com/',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.792069','2025-08-25 05:34:23.792076',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(30,'alami','Alami','https://alamisharia.co.id/en/',NULL,'Indonesia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.792165','2025-08-25 05:34:23.792171',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(31,'alan','Alan','https://alan.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.792292','2025-08-25 05:34:23.792303',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(32,'algorand','Algorand','https://www.algorand.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.792471','2025-08-25 05:34:23.792496',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(33,'algorithmia','Algorithmia','https://algorithmia.com/',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.792666','2025-08-25 05:34:23.792677',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(34,'alice','ALICE','https://aliceplatform.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793170','2025-08-25 05:34:23.793179',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(35,'alight_solutions','Alight Solutions','https://alight.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793328','2025-08-25 05:34:23.793335',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(36,'alley','Alley','https://alley.co',NULL,'USA, Canada, Western Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793454','2025-08-25 05:34:23.793466',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(37,'allydvm','allyDVM','https://www.allydvm.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793567','2025-08-25 05:34:23.793574',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(38,'alphasights','AlphaSights','https://engineering.alphasights.com',NULL,'USA, UK, (EST, GMT)',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793662','2025-08-25 05:34:23.793668',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(39,'amazon','Amazon','https://www.amazon.jobs/en/locatio ns/virtual-locations',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793768','2025-08-25 05:34:23.793775',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(40,'ambaum','Ambaum','https://ambaum.com/',NULL,'USA, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793865','2025-08-25 05:34:23.793871',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(41,'andela','Andela','https://andela.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.793964','2025-08-25 05:34:23.793970',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(42,'animalz','Animalz','https://www.animalz.co',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794088','2025-08-25 05:34:23.794101',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(43,'annertech','Annertech','https://www.annertech.com',NULL,'Ireland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794288','2025-08-25 05:34:23.794299',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(44,'anomali','Anomali','https://www.anomali.com/company/ careers',NULL,'USA, UK, Singapore',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794460','2025-08-25 05:34:23.794473',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(45,'apartment_therapy','apartment therapy','http://www.apartmenttherapy.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794583','2025-08-25 05:34:23.794590',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(46,'appinio','Appinio','https://appinio.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794693','2025-08-25 05:34:23.794717',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(47,'applaudo','Applaudo','https://applaudostudios.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794836','2025-08-25 05:34:23.794843',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(48,'appstractor_corporation','Appstractor Corporation','https://www.appstractor.com/',NULL,'USA, UK, Israel',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.794958','2025-08-25 05:34:23.794970',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(49,'appwrite','Appwrite','https://appwrite.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795113','2025-08-25 05:34:23.795120',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(50,'argyle','argyle','https://argyle.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795235','2025-08-25 05:34:23.795242',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(51,'ark','ARK','https://www.ark.io/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795372','2025-08-25 05:34:23.795382',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(52,'arkency','Arkency','https://arkency.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795515','2025-08-25 05:34:23.795526',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(53,'art_logic','Art & Logic','https://artandlogic.com',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795675','2025-08-25 05:34:23.795682',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(54,'artefactual_systems','Artefactual Systems','https://www.artefactual.com',NULL,'UTC-8 to UTC+2',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795815','2025-08-25 05:34:23.795827',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(55,'articulate','Articulate','https://www.articulate.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.795972','2025-08-25 05:34:23.795983',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(56,'astronomer','Astronomer','https://www.astronomer.io/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.796139','2025-08-25 05:34:23.796150',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(57,'atlassian','Atlassian','https://www.atlassian.com/',NULL,'USA, Europe, Asia, Australia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.796298','2025-08-25 05:34:23.796308',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(58,'audiense','Audiense','https://www.audiense.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.796448','2025-08-25 05:34:23.796462',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(59,'aula_education','Aula Education','https://aula.education/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.796617','2025-08-25 05:34:23.796628',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(60,'auth0','Auth0','https://auth0.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.796787','2025-08-25 05:34:23.796794',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(61,'automattic','Automattic','https://automattic.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.796925','2025-08-25 05:34:23.796937',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(62,'axelerant','Axelerant','https://axelerant.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.797102','2025-08-25 05:34:23.797112',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(63,'axios','Axios','https://axios.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.797258','2025-08-25 05:34:23.797269',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(64,'bairesdev','Bairesdev','https://bairesdev.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.797417','2025-08-25 05:34:23.797428',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(65,'balena','Balena','https://www.balena.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.797593','2025-08-25 05:34:23.797605',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(66,'balsamiq','Balsamiq','https://balsamiq.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.797747','2025-08-25 05:34:23.797758',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(67,'bandcamp','Bandcamp','https://bandcamp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.797896','2025-08-25 05:34:23.797907',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(68,'bandlab','BandLab','https://bandlab.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798071','2025-08-25 05:34:23.798082',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(69,'bandzoogle','Bandzoogle','https://bandzoogle.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798263','2025-08-25 05:34:23.798274',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(70,'baremetrics','Baremetrics','https://baremetrics.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798478','2025-08-25 05:34:23.798486',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(71,'basecamp','Basecamp','https://basecamp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798612','2025-08-25 05:34:23.798619',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(72,'bear_group','Bear Group','https://www.beargroup.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798705','2025-08-25 05:34:23.798711',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(73,'bebanjo','BeBanjo','https://bebanjo.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798809','2025-08-25 05:34:23.798815',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(74,'beenverified','BeenVerified','https://www.beenverified.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.798912','2025-08-25 05:34:23.798919',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(75,'best_practical_solutions','Best Practical Solutions','https://bestpractical.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799015','2025-08-25 05:34:23.799027',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(76,'betable','Betable','https://corp.betable.com/',NULL,'USA, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799136','2025-08-25 05:34:23.799142',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(77,'betapeak','BetaPeak','https://betapeak.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799226','2025-08-25 05:34:23.799232',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(78,'betterup','BetterUp','https://www.betterup.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799324','2025-08-25 05:34:23.799331',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(79,'beyond_company','Beyond Company','https://beyondcompany.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799414','2025-08-25 05:34:23.799421',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(80,'beyondpricing','BeyondPricing','https://beyondpricing.com',NULL,'USA, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799503','2025-08-25 05:34:23.799510',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(81,'big_cartel','Big Cartel','https://www.bigcartel.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799601','2025-08-25 05:34:23.799609',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(82,'bill','Bill','https://www.bill.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799713','2025-08-25 05:34:23.799719',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(83,'bit_zesty','Bit Zesty','https://bitzesty.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799814','2025-08-25 05:34:23.799820',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(84,'bitnami','Bitnami','https://bitnami.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.799912','2025-08-25 05:34:23.799919',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(85,'bitovi','Bitovi','https://bitovi.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800003','2025-08-25 05:34:23.800009',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(86,'bizink','Bizink','https://bizinkonline.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800089','2025-08-25 05:34:23.800096',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(87,'blameless','Blameless','https://www.blameless.com/',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800190','2025-08-25 05:34:23.800201',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(88,'bloc','Bloc','https://www.bloc.io/',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800312','2025-08-25 05:34:23.800319',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(89,'bluecat_networks','BlueCat Networks','https://bluecatnetworks.com/',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800402','2025-08-25 05:34:23.800409',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(90,'bluespark','Bluespark','https://www.bluespark.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800490','2025-08-25 05:34:23.800497',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(91,'boldare','Boldare','https://boldare.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800579','2025-08-25 05:34:23.800586',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(92,'bonsai','Bonsai','https://www.hellobonsai.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800669','2025-08-25 05:34:23.800683',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(93,'bounteous','Bounteous','https://bounteous.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800798','2025-08-25 05:34:23.800807',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(94,'brainstorm_force','Brainstorm Force','https://brainstormforce.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800899','2025-08-25 05:34:23.800906',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(95,'brave_investments','Brave Investments','https://www.crunchbase.com/organi zation/brave-investment',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.800995','2025-08-25 05:34:23.801002',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(96,'bright_funds','Bright Funds','https://www.brightfunds.org',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801085','2025-08-25 05:34:23.801091',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(97,'brikl','Brikl','https://www.brikl.com/',NULL,'North America, Asia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801184','2025-08-25 05:34:23.801190',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(98,'britecore','BriteCore','https://britecore.com/',NULL,'USA, Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801274','2025-08-25 05:34:23.801281',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(99,'broadwing','Broadwing','https://www.broadwing.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801392','2025-08-25 05:34:23.801399',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(100,'buffer','Buffer','https://buffer.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801487','2025-08-25 05:34:23.801493',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(101,'bugfender','Bugfender','https://bugfender.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801574','2025-08-25 05:34:23.801580',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(102,'buysellads','BuySellAds','https://www.buysellads.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801672','2025-08-25 05:34:23.801678',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(103,'cabify','Cabify','https://cabify.com/',NULL,'Spain',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801758','2025-08-25 05:34:23.801765',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(104,'calamari','Calamari','https://calamari.io/',NULL,'Poland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801848','2025-08-25 05:34:23.801855',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(105,'calibre','Calibre','https://calibreapp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.801961','2025-08-25 05:34:23.801968',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(106,'cancom','CANCOM','https://www.cancom.com/',NULL,'Germany, Austria, Slovakia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802069','2025-08-25 05:34:23.802075',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(107,'canonical','Canonical','https://www.canonical.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802161','2025-08-25 05:34:23.802168',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(108,'capchase','Capchase','https://www.capchase.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802251','2025-08-25 05:34:23.802258',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(109,'capital_one','Capital One','https://www.capitalonecareers.com/t ech',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802348','2025-08-25 05:34:23.802358',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(110,'carbon_black','Carbon Black','https://www.carbonblack.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802516','2025-08-25 05:34:23.802527',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(111,'cards_against_humanity','Cards Against Humanity','https://cardsagainsthumanity.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802681','2025-08-25 05:34:23.802692',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(112,'carecru','CareCru','https://carecru.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.802858','2025-08-25 05:34:23.802869',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(113,'caremessage','CareMessage','https://caremessage.org/careers/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.803035','2025-08-25 05:34:23.803048',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(114,'cartodb','CartoDB','https://cartodb.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.803220','2025-08-25 05:34:23.803234',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(115,'cartstack','CartStack','https://www.cartstack.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.803404','2025-08-25 05:34:23.803416',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(116,'casumo','Casumo','https://www.casumo.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.803621','2025-08-25 05:34:23.803634',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(117,'celsius','Celsius','https://celsius.network/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.803792','2025-08-25 05:34:23.803804',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(118,'chainlink_labs','ChainLink Labs','https://chainlinklabs.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.803909','2025-08-25 05:34:23.803916',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(119,'chargify','Chargify','https://www.chargify.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804020','2025-08-25 05:34:23.804027',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(120,'charity_water','charity: water','https://www.charitywater.org/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804115','2025-08-25 05:34:23.804126',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(121,'chatgen','ChatGen','https://chatgen.ai/',NULL,'India, USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804243','2025-08-25 05:34:23.804250',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(122,'checkly','Checkly','https://www.checklyhq.com',NULL,'Europe (CET -3 / CET +3)',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804342','2025-08-25 05:34:23.804349',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(123,'chef','Chef','https://www.chef.io/',NULL,'USA, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804447','2025-08-25 05:34:23.804453',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(124,'chefsclub','ChefsClub','https://www.chefsclub.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804543','2025-08-25 05:34:23.804551',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(125,'chess','Chess','https://www.chess.com/jobs/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804691','2025-08-25 05:34:23.804702',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(126,'chroma','Chroma','https://hichroma.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.804865','2025-08-25 05:34:23.804878',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(127,'circleci','CircleCI','https://circleci.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.805062','2025-08-25 05:34:23.805074',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(128,'circonus','Circonus','https://circonus.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.805218','2025-08-25 05:34:23.805231',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(129,'civicactions','CivicActions','https://civicactions.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.805371','2025-08-25 05:34:23.805399',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(130,'civo','Civo','https://www.civo.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.805549','2025-08-25 05:34:23.805560',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(131,'clevertech','Clevertech','https://clevertech.biz/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.805707','2025-08-25 05:34:23.805720',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(132,'clickup','ClickUp','https://clickup.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.805894','2025-08-25 05:34:23.805906',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(133,'clootrack','Clootrack','https://www.clootrack.com/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.806082','2025-08-25 05:34:23.806096',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(134,'close','Close','https://close.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.806273','2025-08-25 05:34:23.806286',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(135,'cloudapp','CloudApp','https://getcloudapp.com',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.806476','2025-08-25 05:34:23.806487',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(136,'coalition_technologies','Coalition Technologies','https://coalitiontechnologies.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.806655','2025-08-25 05:34:23.806667',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(137,'code_like_a_girl','Code Like a Girl','https://codelikeagirl.com',NULL,'Australia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.806885','2025-08-25 05:34:23.806898',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(138,'codea_it','Codea IT','https://www.codeait.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.807069','2025-08-25 05:34:23.807081',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(139,'codepen','CodePen','https://codepen.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.807250','2025-08-25 05:34:23.807263',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(140,'codesandbox','CodeSandbox','https://codesandbox.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.807459','2025-08-25 05:34:23.807472',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(141,'codeship','Codeship','https://codeship.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.807649','2025-08-25 05:34:23.807661',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(142,'codestunts','Codestunts','https://codestunts.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.807838','2025-08-25 05:34:23.807851',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(143,'cofense','Cofense','https://cofense.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.808015','2025-08-25 05:34:23.808028',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(144,'coinbase','Coinbase','https://www.coinbase.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.808203','2025-08-25 05:34:23.808215',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(145,'coingape','Coingape','https://coingape.com/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.808407','2025-08-25 05:34:23.808419',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(146,'collabora','Collabora','https://www.collabora.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.808585','2025-08-25 05:34:23.808597',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(147,'comet','Comet','https://www.comet.co/',NULL,'France',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.808805','2025-08-25 05:34:23.808824',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(148,'compose','Compose','https://www.compose.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809028','2025-08-25 05:34:23.809035',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(149,'compucorp','Compucorp','https://www.compucorp.co.uk',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809152','2025-08-25 05:34:23.809159',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(150,'connexa','Connexa','https://www.connexa.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809347','2025-08-25 05:34:23.809361',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(151,'consensys','ConsenSys','https://consensys.net/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809527','2025-08-25 05:34:23.809562',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(152,'consumer_financial_protection_bureau','Consumer Financial Protection Bureau','https://www.consumerfinance.gov',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809701','2025-08-25 05:34:23.809708',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(153,'continu','Continu','https://www.continu.co/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809807','2025-08-25 05:34:23.809815',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(154,'conversio','Conversio','https://conversio.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.809910','2025-08-25 05:34:23.809917',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(155,'convert','Convert','https://www.convert.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810010','2025-08-25 05:34:23.810023',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(156,'coodesh','Coodesh','https://coodesh.com/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810146','2025-08-25 05:34:23.810153',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(157,'core_apps','Core-Apps','https://www.core-apps.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810244','2025-08-25 05:34:23.810251',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(158,'coreos','CoreOS','https://coreos.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810339','2025-08-25 05:34:23.810346',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(159,'corgibytes','Corgibytes','https://corgibytes.com',NULL,'USA East Coast',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810435','2025-08-25 05:34:23.810442',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(160,'coursera','Coursera','https://www.coursera.org/',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810530','2025-08-25 05:34:23.810537',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(161,'crossover','Crossover','https://www.crossover.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810633','2025-08-25 05:34:23.810640',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(162,'crowdstrike','Crowdstrike','https://www.crowdstrike.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810757','2025-08-25 05:34:23.810764',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(163,'crowdtangle','CrowdTangle','https://crowdtangle.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810854','2025-08-25 05:34:23.810861',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(164,'cueup','Cueup','https://cueup.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.810960','2025-08-25 05:34:23.810967',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(165,'customer_io','Customer.io','https://customer.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811056','2025-08-25 05:34:23.811063',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(166,'cuvette','Cuvette','https://cuvette.tech',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811147','2025-08-25 05:34:23.811154',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(167,'cvs_health','CVS Health','https://jobs.cvshealth.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811252','2025-08-25 05:34:23.811265',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(168,'cwt','CWT','https://www.mycwt.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811375','2025-08-25 05:34:23.811382',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(169,'cyber_whale','Cyber Whale','https://cyberwhale.tech',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811473','2025-08-25 05:34:23.811481',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(170,'dalenys','Dalenys','https://dalenys.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811567','2025-08-25 05:34:23.811574',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(171,'dappradar','DappRadar','https://dappradar.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811659','2025-08-25 05:34:23.811666',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(172,'darecode','DareCode','https://darecode.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811751','2025-08-25 05:34:23.811757',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(173,'dashboardhub','DashboardHub','https://dashboardhub.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811864','2025-08-25 05:34:23.811876',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(174,'dashlane','Dashlane','https://dashlane.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.811982','2025-08-25 05:34:23.811989',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(175,'data_science_brigade','Data Science Brigade','https://dsbrigade.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812075','2025-08-25 05:34:23.812082',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(176,'data_science_dojo','Data Science Dojo','https://datasciencedojo.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812168','2025-08-25 05:34:23.812175',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(177,'datacamp','DataCamp','https://www.datacamp.com/',NULL,'Europe or comparable timezone',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812259','2025-08-25 05:34:23.812266',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(178,'datadog','Datadog','https://www.datadoghq.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812352','2025-08-25 05:34:23.812359',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(179,'datastax','DataStax','https://www.datastax.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812474','2025-08-25 05:34:23.812486',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(180,'datica','Datica','https://datica.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812579','2025-08-25 05:34:23.812585',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(181,'dealdash','DealDash','http://www.dealdash.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812672','2025-08-25 05:34:23.812679',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(182,'delighted','Delighted','https://delighted.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812766','2025-08-25 05:34:23.812773',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(183,'designcode','Designcode','https://designcode.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812872','2025-08-25 05:34:23.812879',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(184,'deskpass','Deskpass','https://www.deskpass.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.812984','2025-08-25 05:34:23.812996',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(185,'dev_spotlight','Dev Spotlight','https://www.devspotlight.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813110','2025-08-25 05:34:23.813117',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(186,'devsquad','Devsquad','https://devsquad.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813206','2025-08-25 05:34:23.813212',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(187,'dgraph','Dgraph','https://dgraph.io/',NULL,'Americas',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813301','2025-08-25 05:34:23.813308',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(188,'digitalocean','DigitalOcean','https://www.digitalocean.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813408','2025-08-25 05:34:23.813415',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(189,'digitise','Digitise','https://jobs.gohire.io/digitise- xwcfqaab/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813500','2025-08-25 05:34:23.813507',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(190,'discord','Discord','https://discord.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813617','2025-08-25 05:34:23.813629',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(191,'discourse','Discourse','https://www.discourse.org/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813725','2025-08-25 05:34:23.813732',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(192,'dnsimple','DNSimple','https://dnsimple.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813836','2025-08-25 05:34:23.813842',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(193,'docker','Docker','https://www.docker.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.813939','2025-08-25 05:34:23.813945',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(194,'doist','Doist','https://doist.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.814034','2025-08-25 05:34:23.814040',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(195,'donut_app','Donut App','https://www.donut.app/',NULL,'USA, EU',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.814123','2025-08-25 05:34:23.814133',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(196,'dronedeploy','DroneDeploy','https://www.dronedeploy.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.814246','2025-08-25 05:34:23.814253',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(197,'dropbox','Dropbox','https://www.dropbox.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.814350','2025-08-25 05:34:23.814357',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(198,'drupal_jedi','Drupal Jedi','https://drupaljedi.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.814440','2025-08-25 05:34:23.814446',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(199,'duckduckgo','DuckDuckGo','https://duckduckgo.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.814539','2025-08-25 05:34:23.814548',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(200,'dynapictures','DynaPictures','https://dynapictures.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.815052','2025-08-25 05:34:23.815063',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(201,'earthofdrones','EarthOfDrones','https://earthofdrones.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.815226','2025-08-25 05:34:23.815236',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(202,'eatstreet','EatStreet','https://eatstreet.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.815383','2025-08-25 05:34:23.815394',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(203,'ebsco_information_services','EBSCO Information Services','https://www.ebsco.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.815668','2025-08-25 05:34:23.815682',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(204,'eco_mind','Eco-Mind','https://eco-mind.eu/',NULL,'Italy',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.815953','2025-08-25 05:34:23.815967',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(205,'edgar','Edgar','https://meetedgar.com/',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816191','2025-08-25 05:34:23.816198',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(206,'edgio','Edgio','https://edg.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816310','2025-08-25 05:34:23.816317',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(207,'edify','Edify','https://edify.cr/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816401','2025-08-25 05:34:23.816408',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(208,'efishery','eFishery','https://efishery.com/',NULL,'Indonesia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816489','2025-08-25 05:34:23.816495',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(209,'elastic','Elastic','https://www.elastic.co/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816576','2025-08-25 05:34:23.816583',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(210,'emsisoft','Emsisoft','https://www.emsisoft.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816709','2025-08-25 05:34:23.816731',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(211,'engineyard_support_team','EngineYard (Support Team)','https://www.engineyard.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.816909','2025-08-25 05:34:23.816922',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(212,'enjoei','Enjoei','https://www.enjoei.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.817078','2025-08-25 05:34:23.817089',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(213,'enok','Enok','https://www.enok.co/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.817336','2025-08-25 05:34:23.817351',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(214,'entrision','Entrision','https://entrision.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.817597','2025-08-25 05:34:23.817609',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(215,'envato','Envato','https://envato.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.817786','2025-08-25 05:34:23.817798',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(216,'envoy','Envoy','https://envoy.com/',NULL,'USA, Canada, Colombia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.818039','2025-08-25 05:34:23.818052',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(217,'epam','Epam','https://epam.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.818207','2025-08-25 05:34:23.818219',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(218,'epic_games','Epic Games','https://www.epicgames.com/site/en
-US/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.818375','2025-08-25 05:34:23.818402',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(219,'epilocal','Epilocal','https://www.epilocal.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.818631','2025-08-25 05:34:23.818640',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(220,'episource','Episource','https://episource.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.818813','2025-08-25 05:34:23.818820',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(221,'equal_experts_portugal','Equal Experts Portugal','https://www.equalexperts.com/cont act-us/lisbon/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.818919','2025-08-25 05:34:23.818926',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(222,'ergeon','Ergeon','https://www.ergeon.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819014','2025-08-25 05:34:23.819020',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(223,'estately','Estately','https://www.estately.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819104','2025-08-25 05:34:23.819110',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(224,'etch','Etch','https://etch.co',NULL,'UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819199','2025-08-25 05:34:23.819206',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(225,'etsy','Etsy','https://www.etsy.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819287','2025-08-25 05:34:23.819293',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(226,'evelo','EVELO','https://evelo.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819374','2025-08-25 05:34:23.819381',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(227,'evil_martians','Evil Martians','https://evilmartians.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819464','2025-08-25 05:34:23.819471',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(228,'evrone','Evrone','https://evrone.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819558','2025-08-25 05:34:23.819564',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(229,'exportdata','ExportData','https://www.exportdata.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819646','2025-08-25 05:34:23.819652',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(230,'eyeo_adblock_plus','Eyeo (Adblock Plus)','https://eyeo.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819735','2025-08-25 05:34:23.819741',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(231,'factorialhr','FactorialHR','https://www.factorialhr.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819824','2025-08-25 05:34:23.819830',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(232,'fairwinds','Fairwinds','https://www.fairwinds.com',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.819912','2025-08-25 05:34:23.819918',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(233,'faithlife','Faithlife','https://www.faithlife.com/',NULL,'USA, Mexico',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820001','2025-08-25 05:34:23.820007',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(234,'fastly','Fastly','https://www.fastly.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820093','2025-08-25 05:34:23.820100',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(235,'fatmap','FATMAP','https://about.fatmap.com/careers',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820181','2025-08-25 05:34:23.820188',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(236,'fauna','Fauna','https://www.fauna.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820286','2025-08-25 05:34:23.820293',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(237,'featurist','Featurist','https://www.featurist.co.uk/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820380','2025-08-25 05:34:23.820386',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(238,'fetlife','Fetlife','https://fetlife.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820469','2025-08-25 05:34:23.820475',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(239,'ffw_agency','FFW Agency','https://ffwagency.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820556','2025-08-25 05:34:23.820563',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(240,'filament_group','Filament Group','https://www.filamentgroup.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820644','2025-08-25 05:34:23.820651',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(241,'findify','Findify','https://findify.io',NULL,'UTC+2 +- 2',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820732','2025-08-25 05:34:23.820739',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(242,'fingerprintjs','FingerprintJS','https://fingerprintjs.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820819','2025-08-25 05:34:23.820825',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(243,'fire_engine_red','Fire Engine Red','https://fire-engine-red.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.820908','2025-08-25 05:34:23.820914',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(244,'fireball_labs','Fireball Labs','https://www.fireballlabs.com',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821003','2025-08-25 05:34:23.821009',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(245,'fiverr','Fiverr','https://www.fiverr.com/',NULL,'North America, Asia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821094','2025-08-25 05:34:23.821100',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(246,'fivexl','FivexL','https://fivexl.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821181','2025-08-25 05:34:23.821187',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(247,'flexera','Flexera','https://www.flexera.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821268','2025-08-25 05:34:23.821274',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(248,'flightaware','FlightAware','https://flightaware.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821357','2025-08-25 05:34:23.821363',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(249,'flip','Flip','https://flip.id',NULL,'Indonesia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821451','2025-08-25 05:34:23.821458',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(250,'flowing','Flowing','https://flowing.it',NULL,'Italy',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821539','2025-08-25 05:34:23.821546',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(251,'fly_io','Fly.io','https://fly.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821668','2025-08-25 05:34:23.821675',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(252,'fmx','FMX','https://www.gofmx.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821762','2025-08-25 05:34:23.821769',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(253,'focusnetworks','Focusnetworks','https://focusnetworks.com.br',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821855','2025-08-25 05:34:23.821862',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(254,'fohandboh','fohandboh','https://fohandboh.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.821951','2025-08-25 05:34:23.821957',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(255,'formidable','Formidable','https://www.formidable.com/',NULL,'USA, Canada, UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822039','2025-08-25 05:34:23.822046',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(256,'formstack','Formstack','https://www.formstack.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822129','2025-08-25 05:34:23.822135',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(257,'four_kitchens','Four Kitchens','https://fourkitchens.com/',NULL,'North America, Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822218','2025-08-25 05:34:23.822224',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(258,'fraudio','Fraudio','https://www.fraudio.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822319','2025-08-25 05:34:23.822325',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(259,'freeagent','Freeagent','https://www.freeagent.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822409','2025-08-25 05:34:23.822416',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(260,'freeletics','Freeletics','https://www.freeletics.com/',NULL,'Germany, Poland, Portugal',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822498','2025-08-25 05:34:23.822504',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(261,'fuel_made','Fuel Made','https://fuelmade.com/',NULL,'Western North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822587','2025-08-25 05:34:23.822594',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(262,'fullfabric','FullFabric','https://fullfabric.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822679','2025-08-25 05:34:23.822685',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(263,'functionize','Functionize','https://www.functionize.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822768','2025-08-25 05:34:23.822775',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(264,'gaggle','Gaggle','https://www.gaggle.net/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822883','2025-08-25 05:34:23.822890',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(265,'geckoboard','Geckoboard','https://www.geckoboard.com',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.822976','2025-08-25 05:34:23.822983',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(266,'general_assembly','General Assembly','https://generalassemb.ly/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.823066','2025-08-25 05:34:23.823073',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(267,'geo_jobe','GEO Jobe','https://www.geo-jobe.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.823155','2025-08-25 05:34:23.823162',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(268,'gerencianet','Gerencianet','https://gerencianet.com.br',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.823243','2025-08-25 05:34:23.823249',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(269,'gft','GFT','https://www.gft.com/',NULL,'Asia, Europe, Latin America, North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.823358','2025-08-25 05:34:23.823365',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(270,'ghost_foundation','Ghost Foundation','https://ghost.org/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.823759','2025-08-25 05:34:23.823774',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(271,'ghost_inspector','Ghost Inspector','https://ghostinspector.com',NULL,'North America, Latin America, Caribbean',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.823971','2025-08-25 05:34:23.823984',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(272,'giant','Giant','https://giantmade.com',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.824151','2025-08-25 05:34:23.824163',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(273,'giant_swarm','Giant Swarm','https://giantswarm.io',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.824397','2025-08-25 05:34:23.824411',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(274,'gigsalad','GigSalad','https://www.gigsalad.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.824565','2025-08-25 05:34:23.824577',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(275,'gitbook','Gitbook','https://www.gitbook.com/',NULL,'France',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.824724','2025-08-25 05:34:23.824736',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(276,'github','GitHub','https://github.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.825072','2025-08-25 05:34:23.825086',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(277,'gitlab','GitLab','https://about.gitlab.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.825275','2025-08-25 05:34:23.825288',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(278,'gitprime','GitPrime','https://gitprime.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.825510','2025-08-25 05:34:23.825524',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(279,'glenn_website_design','Glenn Website Design','https://glennwebsitedesign.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.825699','2025-08-25 05:34:23.825712',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(280,'glitch','Glitch','https://www.glitch.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.825848','2025-08-25 05:34:23.825858',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(281,'gluware','Gluware','https://gluware.com/',NULL,'USA, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.826076','2025-08-25 05:34:23.826088',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(282,'godaddy','GoDaddy','https://www.godaddy.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.826227','2025-08-25 05:34:23.826240',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(283,'gohiring','GoHiring','https://www.gohiring.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.826377','2025-08-25 05:34:23.826389',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(284,'gojob','Gojob','https://gojob.com/',NULL,'France',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.826603','2025-08-25 05:34:23.826616',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(285,'gorman_health_group','Gorman Health Group','https://conveyhealthsolutions.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.826764','2025-08-25 05:34:23.826776',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(286,'gotsoccer','GotSoccer','https://www.gotpro.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.826907','2025-08-25 05:34:23.826917',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(287,'grafana_labs','Grafana Labs','https://grafana.com/',NULL,'USA and EMEA/EST Timezones',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.827110','2025-08-25 05:34:23.827126',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(288,'granicus','Granicus','https://granicus.com/',NULL,'USA, UK, Australia, India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.827279','2025-08-25 05:34:23.827291',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(289,'graylog','Graylog','https://www.graylog.org/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.827441','2025-08-25 05:34:23.827452',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(290,'gremlin','Gremlin','https://gremlin.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.827586','2025-08-25 05:34:23.827596',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(291,'gridium','Gridium','https://gridium.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.827813','2025-08-25 05:34:23.827825',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(292,'groove','Groove','https://www.groovehq.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.827982','2025-08-25 05:34:23.827992',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(293,'grou_ps','Grou.ps','https://build.gr.ps',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.828131','2025-08-25 05:34:23.828141',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(294,'grubhub','Grubhub','https://www.grubhub.com/',NULL,'USA / Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.828355','2025-08-25 05:34:23.828439',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(295,'gruntwork','Gruntwork','https://www.gruntwork.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.828591','2025-08-25 05:34:23.828604',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(296,'guidesmiths','GuideSmiths','https://www.guidesmiths.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.828724','2025-08-25 05:34:23.828731',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(297,'hack_reactor_remote','Hack Reactor Remote','https://www.hackreactor.com/remot e/',NULL,'Pacific Time Zone (PT)',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.828849','2025-08-25 05:34:23.828861',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(298,'hanno','Hanno','https://hanno.co/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.830229','2025-08-25 05:34:23.830354',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(299,'hanzo','Hanzo','https://hanzo.co',NULL,'USA, UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.830582','2025-08-25 05:34:23.830595',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(300,'happy_cog','Happy Cog','https://happycog.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.830764','2025-08-25 05:34:23.830778',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(301,'harvest','Harvest','https://www.getharvest.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.830967','2025-08-25 05:34:23.830980',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(302,'hashex','Hashex','https://hashex.org/',NULL,'US, Asia, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.831185','2025-08-25 05:34:23.831198',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(303,'hashicorp','HashiCorp','https://www.hashicorp.com/',NULL,'USA, CA, UK, DE, FR, NL, AU, JPN',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.831648','2025-08-25 05:34:23.831659',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(304,'he_labs','HE:labs','https://www.helabs.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.831856','2025-08-25 05:34:23.831866',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(305,'headway','Headway','https://www.headway.io/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.832210','2025-08-25 05:34:23.832293',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(306,'healthfinch','Healthfinch','https://www.healthfinch.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.832496','2025-08-25 05:34:23.832509',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(307,'heap','Heap','https://heapanalytics.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.832651','2025-08-25 05:34:23.832664',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(308,'heetch','Heetch','https://heetch.com/',NULL,'Central Europe Time (CET) +/1h',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.832810','2025-08-25 05:34:23.832843',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(309,'help_scout','Help Scout','https://www.helpscout.net/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.833041','2025-08-25 05:34:23.833054',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(310,'heroku','Heroku','https://www.heroku.com/',NULL,'USA, CA, UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.833205','2025-08-25 05:34:23.833218',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(311,'hireology','Hireology','https://www.hireology.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.833366','2025-08-25 05:34:23.833378',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(312,'homeflicwegrow','HomeFlicWeGrow','https://www.homeflicwegrow.com/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.833590','2025-08-25 05:34:23.833602',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(313,'homevalet','HomeValet','https://homevalet.co',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.833760','2025-08-25 05:34:23.833773',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(314,'honeybadger','Honeybadger','https://www.honeybadger.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.833925','2025-08-25 05:34:23.833937',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(315,'honeycomb','Honeycomb','https://honeycomb.tv/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.834163','2025-08-25 05:34:23.834175',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(316,'hopper','Hopper','https://www.hopper.com/',NULL,'USA, CA, UK, BG, PH, CO',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.834325','2025-08-25 05:34:23.834337',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(317,'hotjar','Hotjar','https://careers.hotjar.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.834486','2025-08-25 05:34:23.834497',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(318,'hudl','Hudl','https://www.hudl.com/',NULL,'USA, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.834710','2025-08-25 05:34:23.834723',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(319,'hugo','Hugo','https://hugo.events',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.834876','2025-08-25 05:34:23.834888',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(320,'human_made','Human Made','https://hmn.md',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.835037','2025-08-25 05:34:23.835048',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(321,'husl_digital','HUSL Digital','https://husldigital.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.835263','2025-08-25 05:34:23.835273',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(322,'hypergiant','Hypergiant','https://www.hypergiant.com/contact
/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.835416','2025-08-25 05:34:23.835427',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(323,'hyperion','Hyperion','https://hyperiondev.com/jobs',NULL,'South Africa',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.835579','2025-08-25 05:34:23.835591',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(324,'hypothesis','Hypothesis','https://hypothes.is',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.835810','2025-08-25 05:34:23.835821',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(325,'ibm','IBM','https://www.ibm.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.835964','2025-08-25 05:34:23.835977',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(326,'iclinic','iClinic','https://iclinic.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.836119','2025-08-25 05:34:23.836130',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(327,'idonethis','IDoneThis','https://idonethis.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.836341','2025-08-25 05:34:23.836353',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(328,'ifit','iFit','https://www.ifit.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.836504','2025-08-25 05:34:23.836516',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(329,'igalia','Igalia','https://www.igalia.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.836658','2025-08-25 05:34:23.836669',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(330,'imagine_learning','Imagine Learning','https://www.imaginelearning.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.836888','2025-08-25 05:34:23.836900',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(331,'impala','Impala','https://www.getimpala.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.837069','2025-08-25 05:34:23.837081',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(332,'impira','Impira','https://www.impira.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.837248','2025-08-25 05:34:23.837260',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(333,'implisense','Implisense','https://implisense.com/',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.837471','2025-08-25 05:34:23.837482',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(334,'incsub','Incsub','https://incsub.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.837650','2025-08-25 05:34:23.837661',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(335,'infinite_red','Infinite Red','https://infinite.red',NULL,'USA, CA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.837819','2025-08-25 05:34:23.837831',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(336,'influxdata','InfluxData','https://influxdata.com',NULL,'USA, UK, DE, IT',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.838053','2025-08-25 05:34:23.838064',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(337,'inpsyde','Inpsyde','https://inpsyde.com/en/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.838241','2025-08-25 05:34:23.838252',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(338,'inquicker','InQuicker','https://inquicker.com',NULL,'USA, CA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.838412','2025-08-25 05:34:23.838424',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(339,'inshorts','Inshorts','https://www.inshorts.com/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.838678','2025-08-25 05:34:23.838693',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(340,'instamobile','Instamobile','https://instamobile.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.838865','2025-08-25 05:34:23.838876',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(341,'instructure','Instructure','https://www.instructure.com/',NULL,'Europe, North America, Oceania',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.839058','2025-08-25 05:34:23.839109',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(342,'intellum','Intellum','https://www.intellum.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.839306','2025-08-25 05:34:23.839319',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(343,'interactive_intelligence','Interactive Intelligence','https://www.inin.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.839473','2025-08-25 05:34:23.839484',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(344,'intercom','Intercom','https://www.intercom.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.839751','2025-08-25 05:34:23.839766',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(345,'interpersonal_frequency_i_f','Interpersonal Frequency (I.F.)','https://ifsight.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.840036','2025-08-25 05:34:23.840046',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(346,'intevity','Intevity','https://www.intevity.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.840206','2025-08-25 05:34:23.840216',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(347,'intuit_inc','Intuit Inc.','https://www.intuit.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.840496','2025-08-25 05:34:23.840508',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(348,'intuition_machines_inc','Intuition Machines, Inc','https://www.imachines.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.840682','2025-08-25 05:34:23.840693',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(349,'invision','InVision','https://www.invisionapp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.840903','2025-08-25 05:34:23.840915',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(350,'iohk','IOHK','https://iohk.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.841122','2025-08-25 05:34:23.841136',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(351,'iopipe','IOpipe','https://www.iopipe.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.841297','2025-08-25 05:34:23.841353',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(352,'ios_app_templates','iOS App Templates','https://www.iosapptemplates.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.841530','2025-08-25 05:34:23.841542',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(353,'ipinfo','IPInfo','https://ipinfo.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.841819','2025-08-25 05:34:23.841833',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(354,'ips_group_inc','IPS Group, Inc.','https://www.ipsgroupinc.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.842039','2025-08-25 05:34:23.842051',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(355,'iqvia','IQVIA','https://jobs.iqvia.com/our-company',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.842308','2025-08-25 05:34:23.842321',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(356,'ironin','iRonin','https://www.ironin.it/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.842512','2025-08-25 05:34:23.842523',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(357,'iterative','Iterative','https://www.iterative.ai/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.842680','2025-08-25 05:34:23.842692',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(358,'iwantmyname','iwantmyname','https://iwantmyname.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.842931','2025-08-25 05:34:23.842944',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(359,'jackson_river','Jackson River','https://jacksonriver.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.843110','2025-08-25 05:34:23.843120',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(360,'jaya_tech','Jaya Tech','https://jaya.tech/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.843272','2025-08-25 05:34:23.843308',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(361,'jbs_custom_software_solutions','JBS Custom Software Solutions','https://www.jbssolutions.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.843544','2025-08-25 05:34:23.843557',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(362,'jitbit','Jitbit','https://www.jitbit.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.843718','2025-08-25 05:34:23.843731',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(363,'jitera','Jitera','https://iruuza-inc.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.843977','2025-08-25 05:34:23.843989',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(364,'jobsity','Jobsity','https://recruitment.jobsity.com/',NULL,'USA, LATAM',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.844177','2025-08-25 05:34:23.844189',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(365,'jolly_good_code','Jolly Good Code','https://www.jollygoodcode.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.844341','2025-08-25 05:34:23.844354',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(366,'journy_io','journy.io','https://www.journy.io',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.844600','2025-08-25 05:34:23.844612',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(367,'joyent','Joyent','https://www.joyent.com/careers/',NULL,'USA, UK, Canada, SK, SG',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.844772','2025-08-25 05:34:23.844783',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(368,'jupiterone','JupiterOne','https://www.jupiterone.com/careers/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.844945','2025-08-25 05:34:23.844956',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(369,'kaggle','Kaggle','https://kaggle.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.845200','2025-08-25 05:34:23.845213',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(370,'kea','kea','https://kea.ai',NULL,'North and Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.845371','2025-08-25 05:34:23.845382',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(371,'keen_io','Keen IO','https://keen.io/',NULL,NULL,NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.845665','2025-08-25 05:34:23.845678',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(372,'kentik','Kentik','https://www.kentik.com/careers',NULL,'USA, Europe, APAC',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.845857','2025-08-25 05:34:23.845869',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(373,'khan_academy','Khan Academy','https://www.khanacademy.org/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.846035','2025-08-25 05:34:23.846046',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(374,'kickback_rewards_systems','KickBack Rewards Systems','https://careers.kickbacksystems.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.846253','2025-08-25 05:34:23.846265',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(375,'kinsta','Kinsta','https://kinsta.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.846423','2025-08-25 05:34:23.846433',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(376,'kiprosh','Kiprosh','https://kiprosh.com',NULL,'USA, India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.846591','2025-08-25 05:34:23.846603',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(377,'kissmetrics','Kissmetrics','https://www.kissmetrics.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.846818','2025-08-25 05:34:23.846830',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(378,'klaviyo','Klaviyo','https://www.klaviyo.com/',NULL,'USA, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.847006','2025-08-25 05:34:23.847017',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(379,'knack','Knack','https://www.knack.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.847165','2025-08-25 05:34:23.847177',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(380,'kodify','Kodify','https://kodify.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.847436','2025-08-25 05:34:23.847449',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(381,'koding','Koding','https://koding.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.847634','2025-08-25 05:34:23.847646',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(382,'komoot','Komoot','https://www.komoot.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.847795','2025-08-25 05:34:23.847807',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(383,'kona','Kona','https://www.heykona.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.848320','2025-08-25 05:34:23.848329',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(384,'konkurenta','Konkurenta','https://konkurenta.com',NULL,'EU',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.848472','2025-08-25 05:34:23.848480',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(385,'kraken','Kraken','https://kraken.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.848591','2025-08-25 05:34:23.848599',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(386,'kuali','Kuali','https://kuali.co',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.848975','2025-08-25 05:34:23.848988',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(387,'labelbox','Labelbox','https://labelbox.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.849160','2025-08-25 05:34:23.849172',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(388,'lambda_school','Lambda School','https://www.lambdaschool.com/',NULL,'USA, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.849321','2025-08-25 05:34:23.849378',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(389,'lambert_labs','Lambert Labs','https://lambertlabs.com/',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.849616','2025-08-25 05:34:23.849630',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(390,'laterpay','LaterPay','https://www.laterpay.net/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.849804','2025-08-25 05:34:23.849816',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(391,'leadership_success','Leadership Success','https://www.leadershipsuccess.co/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.850053','2025-08-25 05:34:23.850066',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(392,'leadfeeder','Leadfeeder','https://www.leadfeeder.com',NULL,'Europe, North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.850249','2025-08-25 05:34:23.850260',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(393,'leadiq','LeadIQ','https://leadiq.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.850410','2025-08-25 05:34:23.850422',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(394,'let_s_encrypt','Let''s Encrypt','https://letsencrypt.org',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.850661','2025-08-25 05:34:23.850674',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(395,'lifen','Lifen','https://www.lifen.health/',NULL,'France, Germany, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.850831','2025-08-25 05:34:23.850842',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(396,'lifetime_value_company','Lifetime Value Company','https://www.ltvco.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.851003','2025-08-25 05:34:23.851054',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(397,'lightbend','Lightbend','https://www.lightbend.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.851307','2025-08-25 05:34:23.851319',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(398,'lightspeed','Lightspeed','https://www.lightspeedhq.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.851509','2025-08-25 05:34:23.851518',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(399,'linaro','Linaro','https://www.linaro.org/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.851768','2025-08-25 05:34:23.851783',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(400,'lincoln_loop','Lincoln Loop','https://lincolnloop.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.851974','2025-08-25 05:34:23.851986',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(401,'line_plus_corporation','LINE Plus Corporation','https://linepluscorp.com/',NULL,'Republic of Korea',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.852160','2025-08-25 05:34:23.852172',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(402,'link11','Link11','https://www.link11.com/',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.852372','2025-08-25 05:34:23.852385',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(403,'linux_foundation','Linux Foundation','https://www.linuxfoundation.org/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.852560','2025-08-25 05:34:23.852572',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(404,'lionsher','LionSher','https://lionsher.com/careers/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.852733','2025-08-25 05:34:23.852744',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(405,'litmus','Litmus','https://litmus.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.852952','2025-08-25 05:34:23.852965',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(406,'liveperson','LivePerson','https://www.liveperson.com/compa ny/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.853138','2025-08-25 05:34:23.853152',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(407,'loadsys_web_strategies','Loadsys Web Strategies','https://www.loadsys.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.853304','2025-08-25 05:34:23.853316',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(408,'localistico','Localistico','https://localistico.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.853533','2025-08-25 05:34:23.853545',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(409,'logdna','LogDNA','https://logdna.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.853705','2025-08-25 05:34:23.853717',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(410,'lullabot','Lullabot','https://www.lullabot.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.853862','2025-08-25 05:34:23.853873',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(411,'luxoft','Luxoft','https://www.luxoft.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.854092','2025-08-25 05:34:23.854104',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(412,'lyseon_tech','Lyseon Tech','https://lt.coop.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.854263','2025-08-25 05:34:23.854276',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(413,'lytx','Lytx','https://www.lytx.com/en-us/about- us/careers',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.854447','2025-08-25 05:34:23.854460',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(414,'madewithlove','madewithlove','https://madewithlove.com',NULL,'UTC-5 to UTC+3',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.854645','2025-08-25 05:34:23.854657',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(415,'madisoft','Madisoft','https://labs.madisoft.it/',NULL,'Italy',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.854809','2025-08-25 05:34:23.854822',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(416,'mailerlite','MailerLite','https://www.mailerlite.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.854984','2025-08-25 05:34:23.854997',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(417,'manifold','Manifold','https://manifold.co',NULL,'UTC-9 to UTC+1',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.855161','2025-08-25 05:34:23.855174',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(418,'mapbox','Mapbox','https://www.mapbox.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.855375','2025-08-25 05:34:23.855388',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(419,'marco_polo','Marco Polo','https://marcopolo.me',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.855541','2025-08-25 05:34:23.855553',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(420,'marketade','Marketade','https://www.marketade.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.855696','2025-08-25 05:34:23.855708',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(421,'marsbased','MarsBased','https://marsbased.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.855920','2025-08-25 05:34:23.855933',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(422,'massive_pixel_creation','Massive Pixel Creation','https://massivepixel.io',NULL,'Poland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.856134','2025-08-25 05:34:23.856146',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(423,'maxicus','Maxicus','https://maxicus.com/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.856372','2025-08-25 05:34:23.856380',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(424,'mayvue','Mayvue','https://mayvue.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.856560','2025-08-25 05:34:23.856572',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(425,'mediacurrent','Mediacurrent','https://www.mediacurrent.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.856759','2025-08-25 05:34:23.856770',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(426,'mediavine','Mediavine','https://www.mediavine.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.856993','2025-08-25 05:34:23.857006',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(427,'medium','Medium','https://medium.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.857178','2025-08-25 05:34:23.857203',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(428,'memberful','Memberful','https://memberful.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.857413','2025-08-25 05:34:23.857425',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(429,'memory','Memory','https://memory.ai/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.857577','2025-08-25 05:34:23.857590',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(430,'mercari','Mercari','https://about.mercari.com/en/',NULL,'Japan',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.857776','2025-08-25 05:34:23.857805',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(431,'merico','Merico','https://merico.dev/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.859312','2025-08-25 05:34:23.859324',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(432,'meridianlink','MeridianLink','https://meridianlink.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.859555','2025-08-25 05:34:23.859567',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(433,'metalab','MetaLab','https://metalab.co',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.859833','2025-08-25 05:34:23.859852',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(434,'metamask','MetaMask','https://metamask.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.860141','2025-08-25 05:34:23.860157',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(435,'meteorops','MeteorOps','https://meteorops.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.860439','2025-08-25 05:34:23.860452',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(436,'microsoft','Microsoft','https://www.microsoft.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.860663','2025-08-25 05:34:23.860675',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(437,'mindful','Mindful','https://getmindful.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.860822','2025-08-25 05:34:23.860833',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(438,'mixcloud','Mixcloud','https://www.mixcloud.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.860995','2025-08-25 05:34:23.861013',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(439,'mixmax','Mixmax','https://mixmax.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.861227','2025-08-25 05:34:23.861239',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(440,'mixrank','MixRank','https://mixrank.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.861380','2025-08-25 05:34:23.861392',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(441,'mobile_jazz','Mobile Jazz','https://mobilejazz.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.861559','2025-08-25 05:34:23.861577',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(442,'modern_health','Modern Health','https://www.modernhealth.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.861720','2025-08-25 05:34:23.861732',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(443,'modern_tribe','Modern Tribe','https://tri.be/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.861871','2025-08-25 05:34:23.861896',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(444,'modsquad','Modsquad','https://modsquad.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.862044','2025-08-25 05:34:23.862056',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(445,'molteo','Molteo','https://molteo.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.862343','2025-08-25 05:34:23.862369',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(446,'mongodb','MongoDB','https://mongodb.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.862607','2025-08-25 05:34:23.862617',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(447,'monthly','Monthly','https://monthly.com',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.862799','2025-08-25 05:34:23.862818',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(448,'mozilla','Mozilla','https://www.mozilla.org/',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.862999','2025-08-25 05:34:23.863010',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(449,'mtc','mtc.','https://www.mtcmedia.co.uk',NULL,'UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.863147','2025-08-25 05:34:23.863158',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(450,'muck_rack','Muck Rack','https://muckrack.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.863292','2025-08-25 05:34:23.863303',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(451,'mux','Mux','https://mux.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.863482','2025-08-25 05:34:23.863493',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(452,'mycelium','Mycelium','https://mycelium.ventures/',NULL,'North America, Europe, Oceania',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.863633','2025-08-25 05:34:23.863645',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(453,'mysql','MySQL','https://www.mysql.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.863794','2025-08-25 05:34:23.863806',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(454,'nagarro','Nagarro','https://www.nagarro.com/en',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.863974','2025-08-25 05:34:23.863986',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(455,'nationwide','Nationwide','https://www.nationwide.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.864128','2025-08-25 05:34:23.864140',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(456,'netapp','NetApp','https://www.netapp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.864289','2025-08-25 05:34:23.864301',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(457,'netguru','Netguru','https://www.netguru.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.864460','2025-08-25 05:34:23.864472',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(458,'netris','Netris','https://www.netris.ai',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.864786','2025-08-25 05:34:23.864794',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(459,'netsparker','Netsparker','https://www.netsparker.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865016','2025-08-25 05:34:23.865024',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(460,'nettl_edinburgh','Nettl Edinburgh','https://www.webdesignedinburgh.c om',NULL,'UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865144','2025-08-25 05:34:23.865151',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(461,'new_context','New Context','https://www.newcontext.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865242','2025-08-25 05:34:23.865249',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(462,'next','NEXT','https://www.nexttrucking.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865375','2025-08-25 05:34:23.865383',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(463,'no_code_no_problem','No Code No Problem','https://www.nocodenoprob.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865477','2025-08-25 05:34:23.865483',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(464,'nodesource','NodeSource','https://nodesource.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865579','2025-08-25 05:34:23.865586',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(465,'noredink','NoRedInk','https://noredink.com',NULL,'UTC-8 to UTC+1',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865713','2025-08-25 05:34:23.865719',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(466,'novoda','Novoda','https://www.novoda.com/',NULL,'UK, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865825','2025-08-25 05:34:23.865832',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(467,'npm','npm','https://www.npmjs.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.865989','2025-08-25 05:34:23.865995',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(468,'nuage','Nuage','https://nuagebiz.tech/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.866267','2025-08-25 05:34:23.866275',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(469,'nuna','Nuna','https://www.nuna.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.866407','2025-08-25 05:34:23.866414',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(470,'nvidia','Nvidia','https://www.nvidia.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.866518','2025-08-25 05:34:23.866524',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(471,'o_reilly_media','O''Reilly Media','https://www.oreilly.com/',NULL,'USA, UK, JPN, CHN',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.866611','2025-08-25 05:34:23.866623',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(472,'o_reilly_online_learning','O''Reilly Online Learning','https://www.oreilly.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.866865','2025-08-25 05:34:23.866871',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(473,'ocient','Ocient','https://ocient.com',NULL,'USA, Europe, India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867011','2025-08-25 05:34:23.867017',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(474,'octopus_deploy','Octopus Deploy','https://octopus.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867131','2025-08-25 05:34:23.867137',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(475,'oddball','Oddball','https://oddball.io/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867220','2025-08-25 05:34:23.867227',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(476,'okta','Okta','https://www.okta.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867316','2025-08-25 05:34:23.867322',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(477,'olark','Olark','https://www.olark.com/',NULL,'UTC-8 to UTC+1',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867461','2025-08-25 05:34:23.867471',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(478,'olist','Olist','https://olist.com/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867657','2025-08-25 05:34:23.867668',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(479,'ollie','Ollie','https://www.myollie.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.867806','2025-08-25 05:34:23.867839',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(480,'ollie_order','Ollie Order','https://ollieorder.com/',NULL,'Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868011','2025-08-25 05:34:23.868039',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(481,'olo','Olo','https://www.olo.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868188','2025-08-25 05:34:23.868194',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(482,'ombulabs','OmbuLabs','https://www.ombulabs.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868274','2025-08-25 05:34:23.868280',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(483,'omniti','OmniTI','https://omniti.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868367','2025-08-25 05:34:23.868373',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(484,'onna','Onna','https://onna.com/',NULL,'USA, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868456','2025-08-25 05:34:23.868462',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(485,'onthegosystems','OnTheGoSystems','https://onthegosystems.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868547','2025-08-25 05:34:23.868557',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(486,'opencity_labs','Opencity Labs','https://opencitylabs.it/',NULL,'Italy',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868692','2025-08-25 05:34:23.868699',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(487,'opencraft','OpenCraft','https://opencraft.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868799','2025-08-25 05:34:23.868805',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(488,'openzeppelin','OpenZeppelin','https://openzeppelin.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868887','2025-08-25 05:34:23.868893',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(489,'optoro','Optoro','https://www.optoro.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.868971','2025-08-25 05:34:23.868977',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(490,'oracle','Oracle','https://www.oracle.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869059','2025-08-25 05:34:23.869065',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(491,'ordermentum','Ordermentum','https://www.ordermentum.com/',NULL,'Australia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869187','2025-08-25 05:34:23.869193',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(492,'our_hometown_inc','Our-Hometown Inc.','https://our-hometown.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869315','2025-08-25 05:34:23.869321',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(493,'outsourcingdev','OutsourcingDev','https://www.outsourcingdev.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869404','2025-08-25 05:34:23.869410',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(494,'over','Over','https://www.madewithover.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869490','2025-08-25 05:34:23.869496',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(495,'packlink','Packlink','https://www.packlink.com/',NULL,'UTC+2',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869583','2025-08-25 05:34:23.869589',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(496,'pagepro','Pagepro','https://pagepro.co',NULL,'UK, PL, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869676','2025-08-25 05:34:23.869687',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(497,'pagerduty','PagerDuty','https://pagerduty.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869817','2025-08-25 05:34:23.869823',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(498,'paktor','Paktor','https://www.gopaktor.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869902','2025-08-25 05:34:23.869908',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(499,'palantir_net','Palantir.net','https://www.palantir.net/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.869984','2025-08-25 05:34:23.869990',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(500,'panther_labs','Panther Labs','https://runpanther.io/',NULL,'USA, Greece',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870066','2025-08-25 05:34:23.870072',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(501,'parabol','Parabol','https://www.parabol.co/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870158','2025-08-25 05:34:23.870165',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(502,'park_assist','Park Assist','https://tech.parkassist.com',NULL,'UTC-8 to UTC+2',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870242','2025-08-25 05:34:23.870252',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(503,'parsely','Parsely','https://www.parse.ly/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870382','2025-08-25 05:34:23.870388',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(504,'particular_software','Particular Software','https://particular.net',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870478','2025-08-25 05:34:23.870484',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(505,'pathable','Pathable','https://pathable.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870572','2025-08-25 05:34:23.870578',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(506,'payfully','Payfully','https://www.payfully.co',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870657','2025-08-25 05:34:23.870663',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(507,'paylocity','Paylocity','https://www.paylocity.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870741','2025-08-25 05:34:23.870748',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(508,'payscale','PayScale','https://www.payscale.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870867','2025-08-25 05:34:23.870873',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(509,'paytm_labs','Paytm Labs','https://paytmlabs.com/',NULL,'Canada, USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.870969','2025-08-25 05:34:23.870975',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(510,'payu','PayU','https://corporate.payu.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871063','2025-08-25 05:34:23.871069',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(511,'peachworks','Peachworks','https://www.getbeyond.com/peach works-restaurant-management- software/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871145','2025-08-25 05:34:23.871150',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(512,'peopledoc','PeopleDoc','https://www.people-doc.com',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871227','2025-08-25 05:34:23.871234',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(513,'percona','Percona','https://www.percona.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871310','2025-08-25 05:34:23.871316',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(514,'pex','Pex','https://pex.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871404','2025-08-25 05:34:23.871447',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(515,'plai','Plai','https://plai.team',NULL,'Europe, North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871687','2025-08-25 05:34:23.871696',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(516,'platform_builders','Platform Builders','https://platformbuilders.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871867','2025-08-25 05:34:23.871874',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(517,'platform_sh','Platform.sh','https://platform.sh/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.871968','2025-08-25 05:34:23.871974',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(518,'pleo','Pleo','https://www.pleo.io/',NULL,'East American / European / African timezones',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872056','2025-08-25 05:34:23.872062',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(519,'plex','Plex','https://plex.tv',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872141','2025-08-25 05:34:23.872147',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(520,'pnc_financial_services','PNC Financial Services','https://www.pnc.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872225','2025-08-25 05:34:23.872231',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(521,'polygon','Polygon','https://polygon.technology/careers/ #all-roles',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872309','2025-08-25 05:34:23.872316',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(522,'powerschool','PowerSchool','https://www.powerschool.com/',NULL,'North America / India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872396','2025-08-25 05:34:23.872401',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(523,'pragma','Pragma','https://www.pragma.co/',NULL,'Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872485','2025-08-25 05:34:23.872491',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(524,'precision_nutrition','Precision Nutrition','https://www.precisionnutrition.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872573','2025-08-25 05:34:23.872579',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(525,'predict_mobile','Predict Mobile','https://predictmobile.com/',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872658','2025-08-25 05:34:23.872663',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(526,'prelude','Prelude','https://www.prelude.co/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872741','2025-08-25 05:34:23.872747',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(527,'previousnext','PreviousNext','https://www.previousnext.com.au/',NULL,'Australia',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872824','2025-08-25 05:34:23.872845',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(528,'prezi','Prezi','https://prezi.com/jobs/',NULL,'Europe, North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.872926','2025-08-25 05:34:23.872932',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(529,'prezly','Prezly','https://www.prezly.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873063','2025-08-25 05:34:23.873069',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(530,'pricewaterhousecoope_rs','PricewaterhouseCoope rs','https://www.pwc.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873148','2025-08-25 05:34:23.873154',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(531,'primer','Primer','https://primer.io/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873231','2025-08-25 05:34:23.873237',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(532,'prisma','Prisma','https://www.prisma.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873334','2025-08-25 05:34:23.873341',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(533,'privacycloud','PrivacyCloud','https://www.privacycloud.com/en',NULL,'Spain',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873418','2025-08-25 05:34:23.873424',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(534,'procenge_tecnologia','Procenge Tecnologia','https://www.procenge.com.br',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873504','2025-08-25 05:34:23.873510',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(535,'procurify','Procurify','https://procurify.com/careers',NULL,'Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873587','2025-08-25 05:34:23.873593',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(536,'progress_engine','Progress Engine','https://www.progress- engine.com/en',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873669','2025-08-25 05:34:23.873675',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(537,'prominent_edge','Prominent Edge','https://prominentedge.com/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873764','2025-08-25 05:34:23.873770',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(538,'puppet','Puppet','https://puppet.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873847','2025-08-25 05:34:23.873853',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(539,'quaderno','Quaderno','https://quaderno.io/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.873940','2025-08-25 05:34:23.873946',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(540,'quantify','Quantify','https://quantifyhq.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874032','2025-08-25 05:34:23.874037',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(541,'questdb','QuestDB','https://questdb.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874112','2025-08-25 05:34:23.874124',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(542,'quora','Quora','https://www.quora.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874201','2025-08-25 05:34:23.874207',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(543,'rackspace','Rackspace','https://rackspace.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874281','2025-08-25 05:34:23.874286',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(544,'raft','Raft','https://goraft.tech',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874363','2025-08-25 05:34:23.874369',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(545,'rainforest_qa','Rainforest QA','https://www.rainforestqa.com/jobs/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874443','2025-08-25 05:34:23.874449',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(546,'rakuten_travel_xchange','Rakuten Travel Xchange','https://solutions.travel.rakuten.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874530','2025-08-25 05:34:23.874537',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(547,'ramp','Ramp','https://www.ramp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874613','2025-08-25 05:34:23.874619',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(548,'reaction_commerce','Reaction Commerce','https://reactioncommerce.com/care ers/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874693','2025-08-25 05:34:23.874699',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(549,'reactiveops_inc','ReactiveOps, Inc.','https://www.reactiveops.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874772','2025-08-25 05:34:23.874778',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(550,'real_digital','real.digital','https://www.real-digital.de',NULL,'Europe UTC-1 to UTC+2',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874851','2025-08-25 05:34:23.874857',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(551,'realtimecrm','RealtimeCRM','https://realtimecrm.co.uk/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.874939','2025-08-25 05:34:23.874945',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(552,'rebelmouse','RebelMouse','https://www.rebelmouse.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875024','2025-08-25 05:34:23.875030',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(553,'reboot_studio','Reboot Studio','https://www.reboot.studio/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875107','2025-08-25 05:34:23.875112',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(554,'recharge','ReCharge','https://rechargepayments.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875189','2025-08-25 05:34:23.875195',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(555,'recurly','Recurly','https://recurly.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875268','2025-08-25 05:34:23.875274',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(556,'red_hat','Red Hat','https://www.redhat.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875363','2025-08-25 05:34:23.875369',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(557,'reddit','Reddit','https://www.redditinc.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875446','2025-08-25 05:34:23.875452',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(558,'redmonk','RedMonk','https://redmonk.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875525','2025-08-25 05:34:23.875531',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(559,'redox','Redox','https://www.redoxengine.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875605','2025-08-25 05:34:23.875612',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(560,'reducer','Reducer','https://reducer.co.uk',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875693','2025-08-25 05:34:23.875699',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(561,'reinteractive','reinteractive','https://reinteractive.com/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875786','2025-08-25 05:34:23.875793',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(562,'remote_garage','Remote Garage','http://www.remotegarage.club/',NULL,'India',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875872','2025-08-25 05:34:23.875877',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(563,'remotebase','RemoteBase','https://remotebase.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.875956','2025-08-25 05:34:23.875962',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(564,'renofi','RenoFi','https://renofi.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876040','2025-08-25 05:34:23.876046',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(565,'replit','Replit','https://replit.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876147','2025-08-25 05:34:23.876158',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(566,'research_square','Research Square','https://www.researchsquare.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876264','2025-08-25 05:34:23.876270',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(567,'revolut','Revolut','https://www.revolut.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876350','2025-08-25 05:34:23.876362',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(568,'roadtrippers','Roadtrippers','https://www.roadtrippers.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876447','2025-08-25 05:34:23.876453',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(569,'rocket_chat','Rocket.Chat','https://rocket.chat',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876527','2025-08-25 05:34:23.876532',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(570,'rtcamp','rtCamp','https://rtcamp.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876613','2025-08-25 05:34:23.876619',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(571,'safeguard_global','Safeguard Global','https://www.safeguardglobal.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876695','2025-08-25 05:34:23.876701',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(572,'salesforce','Salesforce','https://www.salesforce.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.876776','2025-08-25 05:34:23.876782',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(573,'sandhills_development','Sandhills Development','https://sandhillsdev.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.877027','2025-08-25 05:34:23.877041',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(574,'scalac','Scalac','https://scalac.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.877308','2025-08-25 05:34:23.877322',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(575,'scandit','Scandit','https://scandit.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.877594','2025-08-25 05:34:23.877606',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(576,'scopic_software','Scopic Software','https://scopicsoftware.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.877849','2025-08-25 05:34:23.877920',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(577,'scrapingbee','ScrapingBee','https://www.scrapingbee.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.878128','2025-08-25 05:34:23.878141',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(578,'scrapinghub','Scrapinghub','https://scrapinghub.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.878523','2025-08-25 05:34:23.878535',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(579,'scylladb','ScyllaDB','https://scylladb.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.878731','2025-08-25 05:34:23.878742',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(580,'seaplane','Seaplane','https://www.seaplane.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.878923','2025-08-25 05:34:23.878933',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(581,'securityscorecard','SecurityScorecard','https://securityscorecard.com/',NULL,'UTC -3 to -5',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.879072','2025-08-25 05:34:23.879083',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(582,'seeq','Seeq','https://www.seeq.com',NULL,'USA, Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.879285','2025-08-25 05:34:23.879297',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(583,'semaphore','Semaphore','https://semaphoreci.com',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.879442','2025-08-25 05:34:23.879453',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(584,'sendwave','Sendwave','https://www.sendwave.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.879595','2025-08-25 05:34:23.879606',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(585,'serpapi','SerpApi','https://serpapi.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.879833','2025-08-25 05:34:23.879846',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(586,'server_density','Server Density','https://www.serverdensity.com',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.879970','2025-08-25 05:34:23.879977',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(587,'servmask','ServMask','https://servmask.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880064','2025-08-25 05:34:23.880070',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(588,'session','Session','https://getsession.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880155','2025-08-25 05:34:23.880161',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(589,'shareup','Shareup','https://shareup.app',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880240','2025-08-25 05:34:23.880245',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(590,'shippabo','Shippabo','https://shippabo.com',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880377','2025-08-25 05:34:23.880389',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(591,'shogun','Shogun','https://getshogun.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880574','2025-08-25 05:34:23.880585',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(592,'shopify','Shopify','https://www.shopify.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880719','2025-08-25 05:34:23.880730',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(593,'sigma_defense','Sigma Defense','https://sigmadefense.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.880859','2025-08-25 05:34:23.880869',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(594,'signeasy','SignEasy','https://signeasy.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.881598','2025-08-25 05:34:23.881647',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(595,'silverfin','Silverfin','https://www.silverfin.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.881917','2025-08-25 05:34:23.881928',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(596,'simplabs','simplabs','https://simplabs.com/',NULL,'Europe, Americas',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882089','2025-08-25 05:34:23.882101',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(597,'simpletexting','SimpleTexting','https://simpletexting.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882260','2025-08-25 05:34:23.882267',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(598,'six_to_start','Six to Start','https://sixtostart.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882373','2025-08-25 05:34:23.882379',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(599,'skillcrush','Skillcrush','https://skillcrush.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882458','2025-08-25 05:34:23.882465',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(600,'skillshare','Skillshare','https://www.skillshare.com/teach',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882542','2025-08-25 05:34:23.882548',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(601,'skyrocket_ventures','Skyrocket Ventures','https://www.skyrocketventures.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882625','2025-08-25 05:34:23.882630',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(602,'smartcash','SmartCash','https://www.smartcash.cc/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882708','2025-08-25 05:34:23.882714',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(603,'smile_io','Smile.io','https://smile.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882830','2025-08-25 05:34:23.882838',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(604,'smmile_digital','Smmile Digital','https://smmile.com',NULL,'Singapore',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.882928','2025-08-25 05:34:23.882934',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(605,'smugmug','SmugMug','https://www.smugmug.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883011','2025-08-25 05:34:23.883017',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(606,'socket_supply_co','Socket Supply Co.','https://socketsupply.co',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883094','2025-08-25 05:34:23.883100',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(607,'softwaremill','SoftwareMill','https://softwaremill.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883197','2025-08-25 05:34:23.883203',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(608,'sommo','Sommo','https://www.sommo.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883282','2025-08-25 05:34:23.883288',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(609,'soostone','Soostone','https://www.soostone.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883408','2025-08-25 05:34:23.883418',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(610,'soshace','Soshace','https://www.soshace.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883521','2025-08-25 05:34:23.883526',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(611,'spoqa','Spoqa','https://spoqa.co.kr/',NULL,'Republic of Korea, Japan',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883606','2025-08-25 05:34:23.883612',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(612,'spotify','Spotify','https://www.spotify.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883695','2025-08-25 05:34:23.883701',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(613,'spreaker','Spreaker','https://spreaker.com/',NULL,'USA, Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883791','2025-08-25 05:34:23.883797',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(614,'spreedly','Spreedly','https://spreedly.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883877','2025-08-25 05:34:23.883883',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(615,'spruce','Spruce','https://getspruce.com/',NULL,'North America, Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.883973','2025-08-25 05:34:23.883985',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(616,'stack_exchange','Stack Exchange','https://stackexchange.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884145','2025-08-25 05:34:23.884152',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(617,'stairlin','Stairlin','https://www.stairlin.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884252','2025-08-25 05:34:23.884259',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(618,'status','Status','https://www.status.im/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884338','2025-08-25 05:34:23.884344',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(619,'stencil','Stencil','https://getstencil.com/',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884420','2025-08-25 05:34:23.884426',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(620,'sticker_mule','Sticker Mule','https://www.stickermule.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884501','2025-08-25 05:34:23.884507',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(621,'stitch_fix','Stitch Fix','https://www.stitchfix.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884614','2025-08-25 05:34:23.884621',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(622,'stoneco','StoneCo','https://www.stone.co/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884712','2025-08-25 05:34:23.884718',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(623,'stormx','StormX','https://stormx.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884796','2025-08-25 05:34:23.884802',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(624,'strapi','Strapi','https://strapi.io/careers',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884888','2025-08-25 05:34:23.884894',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(625,'streamnative','StreamNative','https://streamnative.io/careers/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.884969','2025-08-25 05:34:23.884975',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(626,'stripe','Stripe','https://stripe.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885050','2025-08-25 05:34:23.885056',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(627,'studysoup','StudySoup','https://studysoup.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885156','2025-08-25 05:34:23.885167',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(628,'superplayer_co','Superplayer & Co','https://superplayer.company/',NULL,'Brazil, Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885257','2025-08-25 05:34:23.885264',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(629,'surevine','Surevine','https://www.surevine.com/',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885341','2025-08-25 05:34:23.885346',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(630,'suse','SUSE','https://www.suse.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885422','2025-08-25 05:34:23.885428',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(631,'sutherland_cloudsource','Sutherland CloudSource','https://www.sutherlandcloudsource. com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885514','2025-08-25 05:34:23.885520',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(632,'sweetrush','SweetRush','https://www.sweetrush.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885602','2025-08-25 05:34:23.885608',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(633,'swimlane','Swimlane','https://www.swimlane.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885685','2025-08-25 05:34:23.885695',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(634,'sysdig','Sysdig◻','https://sysdig.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885808','2025-08-25 05:34:23.885814',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(635,'tag1_consulting','Tag1 Consulting','https://tag1consulting.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885912','2025-08-25 05:34:23.885918',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(636,'taledo','Taledo','https://taledo.com/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.885998','2025-08-25 05:34:23.886004',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(637,'taplytics','Taplytics','https://taplytics.com/',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886081','2025-08-25 05:34:23.886088',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(638,'taskade','Taskade','https://taskade.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886162','2025-08-25 05:34:23.886168',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(639,'tatvasoft','TatvaSoft','https://www.tatvasoft.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886242','2025-08-25 05:34:23.886248',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(640,'taxjar','TaxJar','https://www.taxjar.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886362','2025-08-25 05:34:23.886368',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(641,'teamflow','Teamflow','https://www.teamflowhq.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886449','2025-08-25 05:34:23.886455',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(642,'teamsnap','TeamSnap','https://www.teamsnap.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886529','2025-08-25 05:34:23.886535',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(643,'teamultra','TeamUltra','https://www.computacenter.com/',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886615','2025-08-25 05:34:23.886620',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(644,'ted','TED','https://www.ted.com/',NULL,'USA, CA, Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886696','2025-08-25 05:34:23.886702',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(645,'teleport','Teleport','https://teleport.org/',NULL,'USA< Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886785','2025-08-25 05:34:23.886790',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(646,'telerik','Telerik','https://www.telerik.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.886889','2025-08-25 05:34:23.886897',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(647,'telestax','Telestax','https://telestax.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.887090','2025-08-25 05:34:23.887102',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(648,'tenable','Tenable','https://www.tenable.com/',NULL,'Worldwide, Primarily USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.887274','2025-08-25 05:34:23.887286',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(649,'teravision_technologies','Teravision Technologies','https://teravisiontech.com/',NULL,'Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.887430','2025-08-25 05:34:23.887441',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(650,'test_double','Test Double','https://testdouble.com/',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.887594','2025-08-25 05:34:23.887605',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(651,'testgorilla','TestGorilla','https://www.testgorilla.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.887753','2025-08-25 05:34:23.887764',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(652,'the_crafters_lab','The Crafters Lab','https://thecrafterslab.eu/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.887919','2025-08-25 05:34:23.887930',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(653,'the_grid','The Grid','https://thegrid.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.888092','2025-08-25 05:34:23.888104',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(654,'the_publisher_desk','The Publisher Desk','https://www.publisherdesk.com',NULL,'UK, USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.888251','2025-08-25 05:34:23.888292',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(655,'the_scale_factory','The Scale Factory','https://www.scalefactory.com/',NULL,'UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.888449','2025-08-25 05:34:23.888461',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(656,'the_wirecutter','The Wirecutter','https://thewirecutter.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.888603','2025-08-25 05:34:23.888615',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(657,'theoremone','TheoremOne','https://theoremone.co/',NULL,'UTC-10 to UTC+2',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.888755','2025-08-25 05:34:23.888766',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(658,'thinkful','Thinkful','https://www.thinkful.com/',NULL,'WorldWide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.888908','2025-08-25 05:34:23.888919',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(659,'third_iron','Third Iron','https://thirdiron.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889059','2025-08-25 05:34:23.889072',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(660,'thorn','Thorn','https://thorn.org/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889209','2025-08-25 05:34:23.889233',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(661,'timespot','TimeSpot','https://timespothq.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889362','2025-08-25 05:34:23.889373',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(662,'tipe','Tipe','https://tipe.io',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889503','2025-08-25 05:34:23.889514',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(663,'toast','Toast','https://pos.toasttab.com/',NULL,'USA, Ireland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889664','2025-08-25 05:34:23.889674',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(664,'toggl','toggl','https://toggl.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889824','2025-08-25 05:34:23.889831',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(665,'toptal','Toptal','https://www.toptal.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.889922','2025-08-25 05:34:23.889928',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(666,'tower','Tower','https://www.git-tower.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890006','2025-08-25 05:34:23.890012',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(667,'tractionboard','Tractionboard ◻','https://tractionboard.io/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890097','2025-08-25 05:34:23.890103',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(668,'transition_technologies_advanced_solutions','Transition Technologies - Advanced Solutions','http://www.tt.com.pl/',NULL,'Poland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890200','2025-08-25 05:34:23.890206',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(669,'transloadit','Transloadit','https://transloadit.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890284','2025-08-25 05:34:23.890290',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(670,'travis','Travis','https://travistravis.co',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890398','2025-08-25 05:34:23.890404',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(671,'travis_ci','Travis CI','https://travis-ci.org/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890494','2025-08-25 05:34:23.890500',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(672,'treehouse','Treehouse','https://teamtreehouse.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890576','2025-08-25 05:34:23.890582',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(673,'trello','Trello','https://trello.com/',NULL,'Asia, Europe, North America, Oceania',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890672','2025-08-25 05:34:23.890678',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(674,'truelogic','Truelogic','https://www.truelogicsoftware.com/',NULL,'Latin America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890754','2025-08-25 05:34:23.890759',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(675,'trussworks','TrussWorks','https://truss.works',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890834','2025-08-25 05:34:23.890840',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(676,'tuft_needle','Tuft & Needle','https://www.tuftandneedle.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.890948','2025-08-25 05:34:23.890954',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(677,'turing','Turing','https://www.turing.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891036','2025-08-25 05:34:23.891042',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(678,'twilio','Twilio','https://www.twilio.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891119','2025-08-25 05:34:23.891125',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(679,'two','Two','https://www.two.ai/',NULL,'USA, India, Korea',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891202','2025-08-25 05:34:23.891208',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(680,'udacity','Udacity','https://www.udacity.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891293','2025-08-25 05:34:23.891299',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(681,'uhuru','Uhuru','https://uhurunetwork.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891387','2025-08-25 05:34:23.891393',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(682,'uncapped','Uncapped','https://weareuncapped.com/',NULL,'Europe, USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891496','2025-08-25 05:34:23.891503',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(683,'upwork_pro','Upwork Pro','https://www.upwork.com',NULL,'North America',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891594','2025-08-25 05:34:23.891600',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(684,'upworthy','Upworthy','https://www.upworthy.com/',NULL,'Worldwide, Time Zone: PST, PDT',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891726','2025-08-25 05:34:23.891736',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(685,'usaa','USAA','https://usaa.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.891875','2025-08-25 05:34:23.891887',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(686,'ushahidi','Ushahidi','https://www.ushahidi.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892007','2025-08-25 05:34:23.892014',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(687,'uship','uShip','https://www.uship.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892144','2025-08-25 05:34:23.892153',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(688,'valimail','Valimail','https://www.valimail.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892267','2025-08-25 05:34:23.892273',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(689,'varnish_software','Varnish Software','https://www.varnish- software.com/about-us',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892353','2025-08-25 05:34:23.892359',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(690,'vast_limits','vast limits','https://vastlimits.com/',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892437','2025-08-25 05:34:23.892443',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(691,'vercel','Vercel','https://vercel.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892519','2025-08-25 05:34:23.892533',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(692,'veryfi','Veryfi','https://veryfi.com/about',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892624','2025-08-25 05:34:23.892635',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(693,'viperdev','Viperdev','https://viperdev.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892728','2025-08-25 05:34:23.892734',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(694,'virta_health','Virta Health','https://www.virtahealth.com',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892811','2025-08-25 05:34:23.892817',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(695,'vmware','VMware','https://www.vmware.com/in.html',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892895','2025-08-25 05:34:23.892901',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(696,'voiio','voiio','https://voiio.de',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.892986','2025-08-25 05:34:23.892992',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(697,'vox_media_product_team','Vox Media (Product Team)','https://www.voxmedia.com/',NULL,'USA, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893069','2025-08-25 05:34:23.893075',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(698,'voxy','Voxy','https://boards.greenhouse.io/voxy',NULL,'Brazil, USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893177','2025-08-25 05:34:23.893183',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(699,'vshn','VSHN','https://vshn.ch/jobs',NULL,'Switzerland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893287','2025-08-25 05:34:23.893293',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(700,'wallethub','WalletHub','https://wallethub.com/jobs/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893381','2025-08-25 05:34:23.893387',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(701,'webdevstudios','WebDevStudios','https://webdevstudios.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893465','2025-08-25 05:34:23.893470',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(702,'webfx','WebFX','https://www.webfx.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893545','2025-08-25 05:34:23.893551',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(703,'webikon','Webikon','https://www.webikon.sk/en/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893626','2025-08-25 05:34:23.893632',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(704,'webrunners','Webrunners','https://www.webrunners.de/en/',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893713','2025-08-25 05:34:23.893719',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(705,'wells_fargo','Wells Fargo','https://www.wellsfargo.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893834','2025-08-25 05:34:23.893840',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(706,'wemake_services','wemake.services','https://wemake.services/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.893926','2025-08-25 05:34:23.893932',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(707,'wemakemvp','WeMakeMVP','https://www.wemakemvp.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894007','2025-08-25 05:34:23.894013',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(708,'whitecap_seo','Whitecap SEO','https://www.whitecapseo.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894087','2025-08-25 05:34:23.894093',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(709,'whitespectre','Whitespectre','https://whitespectre.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894175','2025-08-25 05:34:23.894181',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(710,'wikihow','WikiHow','https://www.wikihow.com/wikiHow: About-wikiHow',NULL,'PST Timezone',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894258','2025-08-25 05:34:23.894264',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(711,'wikimedia_foundation','Wikimedia Foundation','https://wikimediafoundation.org',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894347','2025-08-25 05:34:23.894353',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(712,'wildbit','Wildbit','https://wildbit.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894460','2025-08-25 05:34:23.894467',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(713,'wizeline','Wizeline','https://www.wizeline.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894543','2025-08-25 05:34:23.894549',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(714,'wolfram','Wolfram','https://www.wolfram.com',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894634','2025-08-25 05:34:23.894640',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(715,'wolverine_trading','Wolverine Trading','https://www.wolve.com/',NULL,'USA, UK',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894716','2025-08-25 05:34:23.894722',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(716,'wombat_security_technologies','Wombat Security Technologies','https://www.wombatsecurity.com/',NULL,'USA',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894797','2025-08-25 05:34:23.894803',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(717,'wp_media','WP-Media','https://wp-media.me/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.894878','2025-08-25 05:34:23.894884',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(718,'x_team','X-Team','https://x-team.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895003','2025-08-25 05:34:23.895009',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(719,'xapo','Xapo','https://xapo.com/en/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895090','2025-08-25 05:34:23.895096',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(720,'xp_inc','XP Inc','https://www.xpi.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895201','2025-08-25 05:34:23.895207',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(721,'yandex','Yandex','https://yandex.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895290','2025-08-25 05:34:23.895296',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(722,'yazio','YAZIO','https://www.yazio.com/en/jobs',NULL,'Europe',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895371','2025-08-25 05:34:23.895377',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(723,'yodo1','Yodo1','https://www.yodo1.com/en/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895478','2025-08-25 05:34:23.895487',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(724,'yonder','Yonder','https://www.yonder.io',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895595','2025-08-25 05:34:23.895601',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(725,'you_are_launched','You are launched','https://www.urlaunched.com',NULL,'Ukraine, Poland',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895681','2025-08-25 05:34:23.895687',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(726,'you_need_a_budget','You Need A Budget','https://www.youneedabudget.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895783','2025-08-25 05:34:23.895789',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(727,'youcanbook_me_ltd','YouCanBook.me Ltd','https://youcanbook.me',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.895885','2025-08-25 05:34:23.895895',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(728,'zamp','ZAMP','https://zamp.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896001','2025-08-25 05:34:23.896007',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(729,'zapier','Zapier','https://zapier.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896098','2025-08-25 05:34:23.896108',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(730,'zeit_io','Zeit.io','https://zeit.io/',NULL,'Germany, The Netherlands, Spain, Chile',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896260','2025-08-25 05:34:23.896270',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(731,'zenrows','ZenRows','https://www.zenrows.com/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896406','2025-08-25 05:34:23.896416',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(732,'zignaly_com','Zignaly.com','https://zignaly.io/',NULL,'Worldwide',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896555','2025-08-25 05:34:23.896567',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(733,'zip_co','Zip.co','https://zip.co/us/',NULL,'USA, Canada',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896720','2025-08-25 05:34:23.896732',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(734,'zolar','Zolar','https://www.zolar.de/',NULL,'Germany',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.896867','2025-08-25 05:34:23.896878',NULL,0,0.0,0.0);
INSERT INTO "websites" VALUES(735,'zup','Zup','https://zup.com.br/',NULL,'Brazil',NULL,1,0,0,60,1.0,NULL,NULL,NULL,'2025-08-25 05:34:23.897015','2025-08-25 05:34:23.897025',NULL,0,0.0,0.0);
CREATE INDEX idx_website_active ON websites (is_active);
CREATE INDEX idx_website_last_scraped ON websites (last_scraped_at);
CREATE INDEX idx_website_country ON websites (country);
CREATE UNIQUE INDEX ix_websites_website_id ON websites (website_id);
CREATE INDEX idx_model_active ON ml_models (is_active);
CREATE UNIQUE INDEX ix_ml_models_model_id ON ml_models (model_id);
CREATE INDEX ix_ml_models_is_active ON ml_models (is_active);
CREATE INDEX idx_model_type_version ON ml_models (model_type, version);
CREATE INDEX idx_schedule_last_run ON scraping_schedules (last_run_at);
CREATE INDEX ix_scraping_schedules_next_run_at ON scraping_schedules (next_run_at);
CREATE UNIQUE INDEX ix_scraping_schedules_schedule_id ON scraping_schedules (schedule_id);
CREATE INDEX ix_scraping_schedules_last_run_at ON scraping_schedules (last_run_at);
CREATE INDEX ix_scraping_schedules_is_active ON scraping_schedules (is_active);
CREATE INDEX idx_schedule_active_next_run ON scraping_schedules (is_active, next_run_at);
CREATE UNIQUE INDEX ix_job_postings_job_id ON job_postings (job_id);
CREATE INDEX ix_job_postings_website_id ON job_postings (website_id);
CREATE INDEX ix_job_postings_location_city ON job_postings (location_city);
CREATE INDEX ix_job_postings_title ON job_postings (title);
CREATE INDEX idx_job_title_company ON job_postings (title, company_name);
CREATE INDEX ix_job_postings_scraped_at ON job_postings (scraped_at);
CREATE INDEX ix_job_postings_location_country ON job_postings (location_country);
CREATE INDEX idx_job_salary ON job_postings (salary_min, salary_max);
CREATE INDEX idx_job_employment_type ON job_postings (employment_type);
CREATE INDEX ix_job_postings_company_name ON job_postings (company_name);
CREATE INDEX idx_job_scraped_at ON job_postings (scraped_at);
CREATE INDEX ix_job_postings_experience_level ON job_postings (experience_level);
CREATE INDEX ix_job_postings_employment_type ON job_postings (employment_type);
CREATE INDEX idx_job_location ON job_postings (location_city, location_country);
CREATE INDEX ix_scraping_sessions_website_id ON scraping_sessions (website_id);
CREATE INDEX idx_session_spider_website ON scraping_sessions (spider_name, website_id);
CREATE INDEX ix_scraping_sessions_status ON scraping_sessions (status);
CREATE UNIQUE INDEX ix_scraping_sessions_session_id ON scraping_sessions (session_id);
CREATE INDEX idx_session_started_at ON scraping_sessions (started_at);
CREATE INDEX ix_scraping_sessions_completed_at ON scraping_sessions (completed_at);
CREATE INDEX idx_session_status ON scraping_sessions (status);
CREATE INDEX ix_selector_patterns_is_active ON selector_patterns (is_active);
CREATE INDEX idx_selector_website_field ON selector_patterns (website_id, field_name);
CREATE INDEX idx_selector_confidence ON selector_patterns (confidence_score);
CREATE INDEX ix_selector_patterns_website_id ON selector_patterns (website_id);
CREATE INDEX ix_selector_patterns_field_name ON selector_patterns (field_name);
CREATE INDEX idx_error_type_website ON error_logs (error_type, website_id);
CREATE INDEX ix_error_logs_session_id ON error_logs (session_id);
CREATE INDEX ix_error_logs_occurred_at ON error_logs (occurred_at);
CREATE INDEX ix_error_logs_website_id ON error_logs (website_id);
CREATE INDEX ix_error_logs_error_type ON error_logs (error_type);
CREATE INDEX idx_error_occurred_at ON error_logs (occurred_at);
CREATE INDEX idx_error_resolved ON error_logs (is_resolved);
CREATE INDEX ix_error_logs_url ON error_logs (url);
CREATE INDEX ix_error_logs_is_resolved ON error_logs (is_resolved);
CREATE INDEX idx_job_postings_recent ON job_postings (scraped_at DESC, is_active) WHERE is_active = true;
CREATE INDEX idx_job_postings_title ON job_postings (title);
CREATE INDEX idx_job_postings_description ON job_postings (description);
CREATE INDEX idx_error_logs_recent ON error_logs (occurred_at DESC, is_resolved);
COMMIT;
