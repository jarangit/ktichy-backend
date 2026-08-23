import { MigrationInterface, QueryRunner } from 'typeorm';

// baseline schema for fresh databases (previously created via synchronize locally)
export class InitSchema1786000000000 implements MigrationInterface {
  name = 'InitSchema1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`user\` (
        \`id\` varchar(10) NOT NULL,
        \`email\` varchar(255) DEFAULT NULL,
        \`passwordHash\` varchar(255) DEFAULT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`phoneNumber\` varchar(255) DEFAULT NULL,
        \`status\` enum('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
        \`username\` varchar(30) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_user_username\` (\`username\`),
        UNIQUE KEY \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`),
        UNIQUE KEY \`IDX_f2578043e491921209f5dadd08\` (\`phoneNumber\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`store\` (
        \`id\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`owner_id\` varchar(10) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`order_limit\` int NOT NULL DEFAULT '20',
        \`settings\` json DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_8ce7c0371b6fca43a17f523ce44\` (\`owner_id\`),
        CONSTRAINT \`FK_8ce7c0371b6fca43a17f523ce44\` FOREIGN KEY (\`owner_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`category\` (
        \`id\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT '1',
        \`sortOrder\` int NOT NULL DEFAULT '0',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`storeId\` varchar(10) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_52d64a21bc11cd2b4bbabcc5d4b\` (\`storeId\`),
        CONSTRAINT \`FK_52d64a21bc11cd2b4bbabcc5d4b\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`station\` (
        \`id\` varchar(10) NOT NULL,
        \`storeId\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`color\` varchar(255) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_19f83bd21cf93fb0f6f59dbff2f\` (\`storeId\`),
        CONSTRAINT \`FK_19f83bd21cf93fb0f6f59dbff2f\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`product\` (
        \`id\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT '1',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`storeId\` varchar(10) DEFAULT NULL,
        \`stationId\` varchar(10) DEFAULT NULL,
        \`categoryId\` varchar(10) DEFAULT NULL,
        \`price\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`cost\` decimal(10,2) DEFAULT NULL,
        \`isBestSeller\` tinyint NOT NULL DEFAULT '0',
        \`imageUrl\` longtext,
        PRIMARY KEY (\`id\`),
        KEY \`FK_32eaa54ad96b26459158464379a\` (\`storeId\`),
        KEY \`FK_7f9ea9c05dfd08825bb48e0ecf8\` (\`stationId\`),
        KEY \`FK_ff0c0301a95e517153df97f6812\` (\`categoryId\`),
        CONSTRAINT \`FK_32eaa54ad96b26459158464379a\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_7f9ea9c05dfd08825bb48e0ecf8\` FOREIGN KEY (\`stationId\`) REFERENCES \`station\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_ff0c0301a95e517153df97f6812\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`menu\` (
        \`id\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT '1',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`storeId\` varchar(10) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_266438f8f09ba25d8ebbb9f9310\` (\`storeId\`),
        CONSTRAINT \`FK_266438f8f09ba25d8ebbb9f9310\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`device\` (
        \`id\` varchar(10) NOT NULL,
        \`deviceName\` varchar(255) DEFAULT NULL,
        \`fingerprint\` varchar(255) DEFAULT NULL,
        \`store_id\` varchar(10) DEFAULT NULL,
        \`device_id\` varchar(64) NOT NULL,
        \`station_id\` varchar(10) DEFAULT NULL,
        \`alias\` varchar(255) DEFAULT NULL,
        \`app_version\` varchar(255) DEFAULT NULL,
        \`status\` enum('UNPAIRED','PENDING','PAIRED','DISABLED') NOT NULL DEFAULT 'UNPAIRED',
        \`last_seen_at\` datetime DEFAULT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_17d554d4f6b44ff0e200ee4b92\` (\`device_id\`),
        KEY \`FK_365f3de9d913e0b8340be2597ed\` (\`store_id\`),
        KEY \`FK_a0a83b0c68388c80416cbf34c3c\` (\`station_id\`),
        CONSTRAINT \`FK_365f3de9d913e0b8340be2597ed\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_a0a83b0c68388c80416cbf34c3c\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`order\` (
        \`id\` varchar(10) NOT NULL,
        \`orderNumber\` varchar(255) NOT NULL,
        \`status\` enum('NEW','PREPARING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NEW',
        \`isArchived\` tinyint NOT NULL DEFAULT '0',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`storeId\` varchar(10) DEFAULT NULL,
        \`orderType\` enum('DINE_IN','TOGO','DELIVERY') NOT NULL DEFAULT 'DINE_IN',
        \`tableNumber\` varchar(50) DEFAULT NULL,
        \`customerName\` varchar(255) DEFAULT NULL,
        \`deliveryPlatform\` varchar(100) DEFAULT NULL,
        \`deliveryOrderNumber\` varchar(100) DEFAULT NULL,
        \`isWaitingInStore\` tinyint NOT NULL DEFAULT '0',
        PRIMARY KEY (\`id\`),
        KEY \`FK_1a79b2f719ecd9f307d62b81093\` (\`storeId\`),
        CONSTRAINT \`FK_1a79b2f719ecd9f307d62b81093\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_item\` (
        \`id\` varchar(10) NOT NULL,
        \`status\` enum('NEW','PREPARING','READY') NOT NULL DEFAULT 'NEW',
        \`notes\` varchar(255) DEFAULT NULL,
        \`quantity\` int NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`productId\` varchar(10) DEFAULT NULL,
        \`orderId\` varchar(10) DEFAULT NULL,
        \`name\` varchar(255) NOT NULL DEFAULT '',
        \`price\` decimal(10,2) NOT NULL DEFAULT '0.00',
        PRIMARY KEY (\`id\`),
        KEY \`FK_904370c093ceea4369659a3c810\` (\`productId\`),
        KEY \`FK_646bf9ece6f45dbe41c203e06e0\` (\`orderId\`),
        CONSTRAINT \`FK_646bf9ece6f45dbe41c203e06e0\` FOREIGN KEY (\`orderId\`) REFERENCES \`order\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_904370c093ceea4369659a3c810\` FOREIGN KEY (\`productId\`) REFERENCES \`product\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_station_item\` (
        \`id\` varchar(10) NOT NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'pending',
        \`stationId\` varchar(10) DEFAULT NULL,
        \`orderItemId\` varchar(10) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_0ed6e0e1255ccef90b642c49f93\` (\`stationId\`),
        KEY \`FK_4f9e50e4f919f0233c63b844a62\` (\`orderItemId\`),
        CONSTRAINT \`FK_0ed6e0e1255ccef90b642c49f93\` FOREIGN KEY (\`stationId\`) REFERENCES \`station\` (\`id\`),
        CONSTRAINT \`FK_4f9e50e4f919f0233c63b844a62\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`order_item\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`pairing_code\` (
        \`id\` varchar(10) NOT NULL,
        \`store_id\` varchar(10) NOT NULL,
        \`station_id\` varchar(10) DEFAULT NULL,
        \`code\` varchar(32) NOT NULL,
        \`status\` enum('PENDING','EXPIRED','CLOSED') NOT NULL DEFAULT 'PENDING',
        \`expires_at\` datetime DEFAULT NULL,
        \`created_by\` varchar(10) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`storeId\` varchar(10) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_57b37422060287f31e98a503a5\` (\`code\`),
        KEY \`IDX_d89ef015c8975318f4a313128f\` (\`store_id\`),
        KEY \`FK_471b4400dfa1a720ddde3879464\` (\`storeId\`),
        CONSTRAINT \`FK_471b4400dfa1a720ddde3879464\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`pairing_requests\` (
        \`id\` varchar(10) NOT NULL,
        \`pairing_code_id\` varchar(10) NOT NULL,
        \`store_id\` varchar(10) NOT NULL,
        \`station_id\` varchar(10) DEFAULT NULL,
        \`device_id\` varchar(10) NOT NULL,
        \`requested_alias\` varchar(255) DEFAULT NULL,
        \`requested_fingerprint\` varchar(255) DEFAULT NULL,
        \`requested_app_version\` varchar(255) DEFAULT NULL,
        \`status\` enum('WAITING_APPROVAL','APPROVED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'WAITING_APPROVAL',
        \`approved_by\` varchar(10) DEFAULT NULL,
        \`approved_at\` datetime DEFAULT NULL,
        \`expires_at\` datetime DEFAULT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_8f53274011041abb3d652a8fed8\` (\`pairing_code_id\`),
        KEY \`FK_55c2116e42fb798ba70849bfe19\` (\`store_id\`),
        KEY \`FK_68ef2c0b6e11114627b36d409e0\` (\`station_id\`),
        KEY \`FK_32223847d43d3ccd3a8b349fb2e\` (\`device_id\`),
        CONSTRAINT \`FK_32223847d43d3ccd3a8b349fb2e\` FOREIGN KEY (\`device_id\`) REFERENCES \`device\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_55c2116e42fb798ba70849bfe19\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_68ef2c0b6e11114627b36d409e0\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_8f53274011041abb3d652a8fed8\` FOREIGN KEY (\`pairing_code_id\`) REFERENCES \`pairing_code\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`payment\` (
        \`id\` varchar(10) NOT NULL,
        \`orderId\` varchar(10) NOT NULL,
        \`storeId\` varchar(10) NOT NULL,
        \`method\` enum('CASH','QR','DELIVERY_PLATFORM') NOT NULL,
        \`amount\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`receivedAmount\` decimal(10,2) DEFAULT NULL,
        \`change\` decimal(10,2) DEFAULT NULL,
        \`receiptId\` varchar(100) NOT NULL,
        \`status\` enum('PAID','REFUNDED') NOT NULL DEFAULT 'PAID',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_payment_order\` (\`orderId\`),
        KEY \`FK_payment_store\` (\`storeId\`),
        CONSTRAINT \`FK_payment_order\` FOREIGN KEY (\`orderId\`) REFERENCES \`order\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_payment_store\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`quick_note\` (
        \`id\` varchar(10) NOT NULL,
        \`storeId\` varchar(10) NOT NULL,
        \`text\` varchar(60) NOT NULL,
        \`sortOrder\` int NOT NULL DEFAULT '0',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_quick_note_store\` (\`storeId\`),
        CONSTRAINT \`FK_quick_note_store\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `quick_note`');
    await queryRunner.query('DROP TABLE `payment`');
    await queryRunner.query('DROP TABLE `pairing_requests`');
    await queryRunner.query('DROP TABLE `pairing_code`');
    await queryRunner.query('DROP TABLE `order_station_item`');
    await queryRunner.query('DROP TABLE `order_item`');
    await queryRunner.query('DROP TABLE `order`');
    await queryRunner.query('DROP TABLE `device`');
    await queryRunner.query('DROP TABLE `menu`');
    await queryRunner.query('DROP TABLE `product`');
    await queryRunner.query('DROP TABLE `station`');
    await queryRunner.query('DROP TABLE `category`');
    await queryRunner.query('DROP TABLE `store`');
    await queryRunner.query('DROP TABLE `user`');
  }
}
