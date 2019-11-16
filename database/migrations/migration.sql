create schema if not exists khidmat collate utf8mb4_general_ci;

use khidmat;

create table if not exists categories
(
  id         int unsigned auto_increment
    primary key,
  name       varchar(50) null,
  icon       varchar(30) null,
  created_at datetime    null,
  updated_at datetime    null
);

create table if not exists clients
(
  id           int unsigned auto_increment
    primary key,
  name         varchar(20)  null,
  redirect_uri varchar(190) null,
  created_at   datetime     null,
  updated_at   datetime     null
);

create table if not exists divisions
(
  id   int unsigned auto_increment
    primary key,
  name varchar(40) null
);

create table if not exists districts
(
  id          int unsigned auto_increment
    primary key,
  division_id int unsigned not null,
  name        varchar(255) null,
  constraint districts_division_id_foreign
    foreign key (division_id) references divisions (id)
);

create table if not exists file_types
(
  id         int unsigned auto_increment
    primary key,
  name       varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null
);

create table if not exists files
(
  id           int unsigned auto_increment
    primary key,
  file_type_id int unsigned null,
  name         mediumtext   null,
  mime_type    varchar(50)  null,
  created_at   datetime     null,
  updated_at   datetime     null,
  constraint files_file_type_id_foreign
    foreign key (file_type_id) references file_types (id)
      on delete cascade
);

create table if not exists institution_types
(
  id         int unsigned auto_increment
    primary key,
  name       varchar(15) null,
  created_at datetime    null,
  updated_at datetime    null
);

create table if not exists menu_items
(
  id         int unsigned auto_increment
    primary key,
  menu_id    int unsigned not null,
  `order`    int unsigned,
  type       varchar(255) null,
  label      varchar(255) null,
  link       varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint menu_items_menu_id_foreign
    foreign key (menu_id) references menus (id)
      on update cascade on delete cascade
);

create table if not exists menu_locations
(
  id         int unsigned auto_increment
    primary key,
  name       varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null
);

create table if not exists menus
(
  id               int unsigned auto_increment
    primary key,
  menu_location_id int unsigned         not null,
  name             varchar(255)         null,
  disabled         tinyint(1) default 0 null,
  created_at       datetime             null,
  updated_at       datetime             null,
  constraint menus_menu_location_id_foreign
    foreign key (menu_location_id) references menu_locations (id)
);

create table if not exists permissions
(
  id           int unsigned auto_increment
    primary key,
  name         varchar(50) null,
  display_name varchar(50) null,
  created_at   datetime    null,
  updated_at   datetime    null
);

create table if not exists positions
(
  id         int unsigned auto_increment
    primary key,
  name       varchar(100) null,
  created_at datetime     null,
  updated_at datetime     null
);

create table if not exists roles
(
  id          int unsigned auto_increment
    primary key,
  name        varchar(30)          not null,
  writable    tinyint(1) default 1 null,
  description varchar(150)         null,
  created_at  datetime             null,
  updated_at  datetime             null
);

create table if not exists role_permission
(
  id            int unsigned auto_increment
    primary key,
  role_id       int unsigned not null,
  permission_id int unsigned not null,
  created_at    datetime     null,
  updated_at    datetime     null,
  constraint role_permission_permission_id_foreign
    foreign key (permission_id) references permissions (id)
      on update cascade on delete cascade,
  constraint role_permission_role_id_foreign
    foreign key (role_id) references roles (id)
      on update cascade on delete cascade
);

create table if not exists settings
(
  id         int unsigned auto_increment
    primary key,
  name       varchar(255) null,
  value      mediumtext   null,
  label      varchar(255) null,
  type       varchar(255),
  created_at datetime     null,
  updated_at datetime     null
);

create table if not exists thanas
(
  id          int unsigned auto_increment
    primary key,
  district_id int unsigned not null,
  name        varchar(255) null,
  constraint thanas_district_id_foreign
    foreign key (district_id) references districts (id)
);

create table if not exists user_types
(
  id   int unsigned auto_increment
    primary key,
  name varchar(12) not null,
  constraint user_types_name_unique
    unique (name)
);

create table if not exists users
(
  id           int unsigned auto_increment
    primary key,
  user_type_id int unsigned         not null,
  photo        int unsigned         null,
  mobile       varchar(15)          not null,
  email        varchar(190)         null,
  password     varchar(60)          not null,
  verified     tinyint(1) default 0 null,
  disabled     tinyint(1) default 0 null,
  name         varchar(190)         null,
  created_at   datetime             null,
  updated_at   datetime             null,
  constraint users_email_user_type_id_unique
    unique (email, user_type_id),
  constraint users_mobile_user_type_id_verified_unique
    unique (mobile, user_type_id, verified),
  constraint users_photo_foreign
    foreign key (photo) references files (id)
      on delete cascade,
  constraint users_user_type_id_foreign
    foreign key (user_type_id) references user_types (id)
);

create table if not exists activities
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  name       varchar(255) null,
  payload    varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint activities_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists file_user
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  file_id    int unsigned not null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint file_user_file_id_foreign
    foreign key (file_id) references files (id)
      on delete cascade,
  constraint file_user_user_id_foreign
    foreign key (user_id) references users (id)
      on delete cascade
);

create table if not exists institutions
(
  id                  int unsigned auto_increment
    primary key,
  user_id             int unsigned not null,
  institution_type_id int unsigned null,
  category_id         int unsigned null,
  description         text         null,
  address             varchar(255) null,
  created_at          datetime     null,
  updated_at          datetime     null,
  constraint institutions_category_id_foreign
    foreign key (category_id) references categories (id),
  constraint institutions_institution_type_id_foreign
    foreign key (institution_type_id) references institution_types (id),
  constraint institutions_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists jobs
(
  id               int unsigned auto_increment
    primary key,
  user_id          int unsigned           not null,
  district_id      int unsigned           not null,
  thana_id         int unsigned           not null,
  position_id      int unsigned           not null,
  vacancy          int unsigned default 1 null,
  responsibilities text                   not null,
  additional       text                   null,
  education        text                   null,
  age_from         int unsigned           null,
  age_to           int unsigned           null,
  village          varchar(255)           not null,
  experience_from  int unsigned default 0 null,
  experience_to    int unsigned default 0 null,
  gender           tinyint(3)   default 1 null,
  approved         tinyint(1)   default 0 null,
  rejected         tinyint(1)   default 0 null,
  negotiable       tinyint(1)   default 0 null,
  special          tinyint(1)   default 0 null,
  nature           tinyint(2)   default 1 null,
  salary_from      int unsigned           null,
  salary_to        int unsigned           null,
  deadline         date                   null,
  created_at       datetime               null,
  updated_at       datetime               null,
  constraint jobs_district_id_foreign
    foreign key (district_id) references districts (id),
  constraint jobs_position_id_foreign
    foreign key (position_id) references positions (id),
  constraint jobs_thana_id_foreign
    foreign key (thana_id) references thanas (id),
  constraint jobs_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists applications
(
  id         int unsigned auto_increment
    primary key,
  job_id     int unsigned not null,
  user_id    int unsigned not null,
  shortlist  tinyint(1)   null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint applications_job_id_foreign
    foreign key (job_id) references jobs (id),
  constraint applications_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists favorites
(
  id         int unsigned auto_increment
    primary key,
  job_id     int unsigned not null,
  user_id    int unsigned not null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint favorites_job_id_foreign
    foreign key (job_id) references jobs (id),
  constraint favorites_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists job_requests
(
  id         int unsigned auto_increment
    primary key,
  job_id     int unsigned not null,
  moderator  int unsigned not null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint job_requests_job_id_foreign
    foreign key (job_id) references jobs (id)
      on update cascade on delete cascade,
  constraint job_requests_moderator_foreign
    foreign key (moderator) references users (id)
);

create table if not exists notifications
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned         not null,
  pic        int unsigned         null,
  title      varchar(255)         null,
  link       varchar(255)         null,
  seen       tinyint(1) default 0 null,
  message    varchar(255)         null,
  created_at datetime             null,
  updated_at datetime             null,
  constraint notifications_pic_foreign
    foreign key (pic) references files (id),
  constraint notifications_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists password_resets
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  token      varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint password_resets_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists posts
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  title      mediumtext   null,
  content    longtext     null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint posts_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists rejected_jobs
(
  id         int unsigned auto_increment
    primary key,
  job_id     int unsigned not null,
  message    mediumtext   null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint rejected_jobs_job_id_foreign
    foreign key (job_id) references jobs (id)
      on update cascade on delete cascade
);

create table if not exists resume_educations
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  marhala    varchar(30)  null,
  result     varchar(30)  null,
  year       smallint(6)  null,
  madrasa    varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint resume_educations_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists resume_experiences
(
  id               int unsigned auto_increment
    primary key,
  user_id          int unsigned not null,
  institute        varchar(255) null,
  designation      varchar(60)  null,
  address          varchar(255) null,
  start            date         null,
  end              date         null,
  current          tinyint(1)   null,
  responsibilities text         null,
  created_at       datetime     null,
  updated_at       datetime     null,
  constraint resume_experiences_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists resume_trainings
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  title      varchar(50)  null,
  topics     varchar(255) null,
  institute  varchar(255) null,
  year       smallint(6)  null,
  duration   varchar(30)  null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint resume_trainings_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists resumes
(
  id               int unsigned auto_increment
    primary key,
  user_id          int unsigned not null,
  father           varchar(60)  null,
  mother           varchar(60)  null,
  dob              date         null,
  mobile           varchar(15)  null,
  email            varchar(190) null,
  gender           varchar(20)  null,
  marital_status   varchar(20)  null,
  nationality      varchar(40)  null,
  district         int unsigned null,
  thana            int unsigned null,
  village          varchar(255) null,
  present_district int unsigned null,
  present_thana    int unsigned null,
  present_village  varchar(255) null,
  created_at       datetime     null,
  updated_at       datetime     null,
  constraint resumes_district_foreign
    foreign key (district) references districts (id),
  constraint resumes_present_district_foreign
    foreign key (present_district) references districts (id),
  constraint resumes_present_thana_foreign
    foreign key (present_thana) references thanas (id),
  constraint resumes_thana_foreign
    foreign key (thana) references thanas (id),
  constraint resumes_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists role_user
(
  id         int unsigned auto_increment
    primary key,
  role_id    int unsigned not null,
  user_id    int unsigned not null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint role_user_role_id_foreign
    foreign key (role_id) references roles (id)
      on update cascade on delete cascade,
  constraint role_user_user_id_foreign
    foreign key (user_id) references users (id)
      on update cascade on delete cascade
);

create table if not exists tokens
(
  id         int unsigned auto_increment
    primary key,
  user_id    int unsigned not null,
  `key`      varchar(255) null,
  created_at datetime     null,
  updated_at datetime     null,
  constraint tokens_user_id_foreign
    foreign key (user_id) references users (id)
);

create index tokens_key_user_id_index
  on tokens (`key`, user_id);

create table if not exists verification_tokens
(
  id          int unsigned auto_increment
    primary key,
  user_id     int unsigned                           not null,
  type        varchar(255)                           null,
  payload     mediumtext                             null,
  auto_delete tinyint(1)   default 1                 null,
  token       varchar(255)                           null,
  try         int unsigned default 0                 null,
  last_send   timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
  created_at  datetime                               null,
  updated_at  datetime                               null,
  constraint verification_tokens_user_id_foreign
    foreign key (user_id) references users (id)
);

create table if not exists villages
(
  id int unsigned auto_increment
    primary key
);

create definer = root@localhost event AutoDeleteExpiredTokens on schedule
  at '2019-10-04 10:52:44'
  on completion preserve
  disable
  do
  DELETE
  FROM chakuri.tokens
  WHERE updated_at < DATE_SUB(NOW(), INTERVAL 5 HOUR);

create definer = root@localhost event AutoDeleteExpiredVerificationTokens on schedule
  at '2019-10-03 11:52:44'
  on completion preserve
  disable
  do
  DELETE
  FROM chakuri.verification_tokens
  WHERE auto_delete = 1
    and created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

