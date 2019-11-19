drop table if exists data_sharing_manager.extract_technical_details;

create table data_sharing_manager.extract_technical_details (
    uuid char(36) NOT NULL COMMENT 'Unique identifier for the extract technical details',
    `name` varchar(200) COMMENT 'Name of the extract technical details',
    sftp_host_name varchar(100) COMMENT 'SFTP host name',
    sftp_host_directory varchar(100) COMMENT 'SFTP host directory, typically /ftp/',
    sftp_host_port varchar(10) COMMENT 'SFTP host port',
    sftp_client_username varchar(100) COMMENT 'SFTP client username',
    sftp_client_private_key_password varchar(100) COMMENT 'SFTP client private key password, rarely used',
    sftp_host_public_key_filename varchar(100) COMMENT 'Filename for the SFTP host public key, rarely used (.pub)',
    sftp_host_public_key_fileData mediumtext COMMENT 'Base64 encoded file data for the SFTP host public key, rarely used (.pub)',
    sftp_client_private_key_filename varchar(100) COMMENT 'Filename for the SFTP client private key (.ppk)',
    sftp_client_private_key_fileData mediumtext COMMENT 'Base64 encoded file data for the SFTP client private key (.ppk)',
    pgp_customer_public_key_filename varchar(100) COMMENT 'Filename for the PGP customer public key (.cer)',
    pgp_customer_public_key_fileData mediumtext NOT NULL COMMENT 'Base64 encoded file data for the PGP customer public key (.cer)',
    pgp_internal_public_key_filename varchar(100) COMMENT 'Filename for the PGP internal public key (.cer)',
    pgp_internal_public_key_fileData mediumtext NOT NULL COMMENT 'Base64 encoded file data for the PGP internal public key (.cer)',

    primary key data_sharing_manager_extract_technical_details_uuid (uuid)
) comment 'Hold extract technical details';
