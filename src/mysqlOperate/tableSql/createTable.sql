-- 创建学生表
CREATE TABLE `student` (
    `name` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
    `age` INT DEFAULT NULL COMMENT '年龄',
    `desc` VARCHAR(100) DEFAULT NULL COMMENT '描述',
    -- 系统默认字段
    `id` int NOT NULL AUTO_INCREMENT COMMENT '系统默认字段,唯一主键',
    `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '系统默认字段,创建时间',
    `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '系统默认字段,更新时间',
    -- `is_delete` int NOT NULL DEFAULT 0 COMMENT '系统默认字段,是否被删除',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 创建教师表
CREATE TABLE `teacher` (
    `name` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
    `age` VARCHAR(50) DEFAULT NULL COMMENT '年龄',
    `desc` VARCHAR(100) DEFAULT NULL COMMENT '描述',
    -- 系统默认字段
    `id` int NOT NULL AUTO_INCREMENT COMMENT '系统默认字段,唯一主键',
    `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '系统默认字段,创建时间',
    `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '系统默认字段,更新时间',
    -- `is_delete` int NOT NULL DEFAULT 0 COMMENT '系统默认字段,是否被删除',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;