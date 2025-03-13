// 辅助函数
export function camelCase(str: string, capitalizeFirstLetter: boolean = false): string {
    const result = str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
    if (capitalizeFirstLetter) {
        return result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
}

export function snakeCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
}

// 类型定义
interface ConversionOptions {
    packageName: string;
    generateJson: boolean;
    generateDb: boolean;
    generateGorm: boolean;
    usePointers: boolean;
    language?: string;
}

// ==================== SQL 转 Go ====================
export function sqlToGo(sql: string, options: ConversionOptions): string {
    try {
        // 解析 SQL CREATE TABLE 语句
        const tableName = extractTableName(sql);
        const structName = camelCase(tableName, true);
        const columns = extractColumns(sql);

        // 生成 Go struct
        let goStruct = `package ${options.packageName}\n\n`;
        goStruct += `type ${structName} struct {\n`;

        for (const col of columns) {
            const fieldName = camelCase(col.name, true);
            const fieldType = sqlTypeToGoType(col.type);

            goStruct += `\t${fieldName} ${options.usePointers ? '*' : ''}${fieldType}`;

            // 添加 tag
            const tags: string[] = [];
            if (options.generateJson) {
                tags.push(`json:"${col.name.toLowerCase()}"`);
            }
            if (options.generateDb) {
                tags.push(`db:"${col.name.toLowerCase()}"`);
            }
            if (options.generateGorm) {
                let gormTag = `gorm:"column:${col.name}`;

                // 添加主键标记
                if (col.name.toLowerCase() === 'id' || col.isPrimary) {
                    gormTag += ';primaryKey';
                }

                // 添加唯一索引标记
                if (col.isUnique) {
                    gormTag += ';uniqueIndex';
                }

                // 添加自增标记
                if (col.isAutoIncrement) {
                    gormTag += ';autoIncrement';
                }

                // 添加类型标记
                if (col.type) {
                    gormTag += `;type:${col.type}`;
                }

                // 添加默认值标记
                if (col.defaultValue) {
                    gormTag += `;default:${col.defaultValue}`;
                }

                gormTag += '"';
                tags.push(gormTag);
            }

            if (tags.length > 0) {
                goStruct += ` \`${tags.join(" ")}\``;
            }

            goStruct += '\n';
        }

        goStruct += `}`;

        return goStruct;
    } catch (e) {
        throw new Error(`Failed to convert SQL to Go: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// ==================== Proto 转 Go ====================
export function protoToGo(proto: string, options: ConversionOptions): string {
    try {
        // 解析 Proto 定义
        const messages = extractProtoMessages(proto);

        // 生成 Go struct
        let goStruct = `package ${options.packageName}\n\n`;

        for (const msg of messages) {
            goStruct += `type ${msg.name} struct {\n`;

            for (const field of msg.fields) {
                const fieldName = camelCase(field.name, true);
                let fieldType;

                if (field.isMap) {
                    fieldType = protoTypeToGoType('', false, true, field.mapKeyType, field.mapValueType);
                } else {
                    fieldType = protoTypeToGoType(field.type, field.repeated);
                }

                goStruct += `\t${fieldName} ${options.usePointers && !field.repeated && !field.isMap ? '*' : ''}${fieldType}`;

                // 添加 tag
                const tags: string[] = [];
                if (options.generateJson) {
                    tags.push(`json:"${field.name.toLowerCase()}"`);
                }
                if (options.generateDb) {
                    tags.push(`db:"${field.name.toLowerCase()}"`);
                }
                if (options.generateGorm) {
                    tags.push(`gorm:"column:${field.name.toLowerCase()}"`);
                }

                if (tags.length > 0) {
                    goStruct += ` \`${tags.join(" ")}\``;
                }

                goStruct += '\n';
            }

            goStruct += `}\n\n`;
        }

        return goStruct.trim();
    } catch (e) {
        throw new Error(`Failed to convert Proto to Go: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// ==================== Go 转 SQL ====================
export function goToSql(goCode: string, options: ConversionOptions): string {
    try {
        // 解析 Go struct
        const structs = extractGoStructs(goCode);

        // 生成 SQL CREATE TABLE 语句
        let sql = "";

        for (const struct of structs) {
            sql += `CREATE TABLE ${snakeCase(struct.name)} (\n`;

            const columns: string[] = [];
            for (const field of struct.fields) {
                const columnName = snakeCase(field.name);
                const columnType = goTypeToSqlType(field.type);

                columns.push(`  ${columnName} ${columnType}`);
            }

            sql += columns.join(",\n");
            sql += `\n);\n\n`;
        }

        return sql.trim();
    } catch (e) {
        throw new Error(`Failed to convert Go to SQL: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// ==================== Go 转 Proto ====================
export function goToProto(goCode: string, options: ConversionOptions): string {
    try {
        // 解析 Go struct
        const structs = extractGoStructs(goCode);

        // 生成 Proto 定义
        let proto = `syntax = "proto3";\n\n`;
        proto += `package ${options.packageName};\n\n`;

        for (const struct of structs) {
            proto += `message ${struct.name} {\n`;

            for (let i = 0; i < struct.fields.length; i++) {
                const field = struct.fields[i];
                const fieldName = snakeCase(field.name);
                const fieldType = goTypeToProtoType(field.type);
                const repeated = field.type.startsWith("[]");

                proto += `  ${repeated ? 'repeated ' : ''}${fieldType} ${fieldName} = ${i + 1};\n`;
            }

            proto += `}\n\n`;
        }

        return proto.trim();
    } catch (e) {
        throw new Error(`Failed to convert Go to Proto: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// ==================== 辅助函数 ====================
function extractTableName(sql: string): string {
    const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/i);
    if (!match) throw new Error("Could not extract table name from SQL");
    return match[1];
}

function extractColumns(sql: string): { name: string, type: string, isPrimary: boolean, isUnique: boolean, isAutoIncrement: boolean, defaultValue: string | null }[] {
    // 提取表定义部分
    const tableDefMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(?:\w+)[`"']?\s*\(([\s\S]+?)\)(?:\s+ENGINE|$)/i);
    if (!tableDefMatch) throw new Error("Could not extract table definition from SQL");

    const tableDefinition = tableDefMatch[1];

    // 分割列定义和表约束
    const lines = tableDefinition.split(',').map(line => line.trim());

    const columns: {
        name: string,
        type: string,
        isPrimary: boolean,
        isUnique: boolean,
        isAutoIncrement: boolean,
        defaultValue: string | null
    }[] = [];

    // 查找主键和唯一键约束
    const primaryKeys: string[] = [];
    const uniqueKeys: Set<string> = new Set();

    for (const line of lines) {
        if (line.toUpperCase().includes('PRIMARY KEY')) {
            const pkMatch = line.match(/PRIMARY\s+KEY\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i);
            if (pkMatch) {
                primaryKeys.push(pkMatch[1]);
            }
        }

        if (line.toUpperCase().includes('UNIQUE KEY')) {
            const ukMatch = line.match(/UNIQUE\s+KEY\s*[`"']?\w+[`"']?\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i);
            if (ukMatch) {
                uniqueKeys.add(ukMatch[1]);
            }
        }
    }

    // 解析列定义
    for (const line of lines) {
        // 跳过表约束行
        if (line.toUpperCase().startsWith('PRIMARY KEY') ||
            line.toUpperCase().startsWith('FOREIGN KEY') ||
            line.toUpperCase().startsWith('UNIQUE KEY') ||
            line.toUpperCase().startsWith('KEY') ||
            line.toUpperCase().startsWith('INDEX')) {
            continue;
        }

        // 匹配列定义，如 `id` bigint(18) NOT NULL AUTO_INCREMENT
        const columnMatch = line.match(/[`"']?(\w+)[`"']?\s+([^\s,]+(?:\([^)]+\))?)\s*(.*)/i);
        if (!columnMatch) continue;

        const name = columnMatch[1];
        const type = columnMatch[2];
        const constraints = columnMatch[3] || '';

        // 检查是否为主键
        const isPrimary = primaryKeys.includes(name) || constraints.toUpperCase().includes('PRIMARY KEY');

        // 检查是否为唯一键
        const isUnique = uniqueKeys.has(name) || constraints.toUpperCase().includes('UNIQUE');

        // 检查是否自增
        const isAutoIncrement = constraints.toUpperCase().includes('AUTO_INCREMENT');

        // 提取默认值
        let defaultValue: string | null = null;
        const defaultMatch = constraints.match(/DEFAULT\s+['"]?([^'"]+)['"]?/i);
        if (defaultMatch) {
            defaultValue = defaultMatch[1];
        }

        columns.push({
            name,
            type,
            isPrimary,
            isUnique,
            isAutoIncrement,
            defaultValue
        });
    }

    return columns;
}

function sqlTypeToGoType(sqlType: string): string {
    const typeMap: Record<string, string> = {
        'INT': 'int',
        'INTEGER': 'int',
        'TINYINT': 'int8',
        'SMALLINT': 'int16',
        'MEDIUMINT': 'int32',
        'BIGINT': 'int64',
        'FLOAT': 'float32',
        'DOUBLE': 'float64',
        'DECIMAL': 'float64',
        'CHAR': 'string',
        'VARCHAR': 'string',
        'TEXT': 'string',
        'LONGTEXT': 'string',
        'DATE': 'time.Time',
        'DATETIME': 'time.Time',
        'TIMESTAMP': 'time.Time',
        'BOOLEAN': 'bool',
        'BOOL': 'bool',
        'BLOB': '[]byte',
        'JSON': 'json.RawMessage',
    };

    // 处理带括号的类型，如 VARCHAR(255)
    const baseType = sqlType.split('(')[0].toUpperCase();
    return typeMap[baseType] || 'interface{}';
}

function extractProtoMessages(proto: string): { name: string, fields: { name: string, type: string, repeated: boolean, isMap: boolean, mapKeyType?: string, mapValueType?: string }[] }[] {
    const messages: {
        name: string,
        fields: {
            name: string,
            type: string,
            repeated: boolean,
            isMap: boolean,
            mapKeyType?: string,
            mapValueType?: string
        }[]
    }[] = [];

    // 提取消息定义
    const messageRegex = /message\s+(\w+)\s*\{([^}]*)\}/gs;
    let match;

    while ((match = messageRegex.exec(proto)) !== null) {
        const messageName = match[1];
        const messageBody = match[2];

        const fields: {
            name: string,
            type: string,
            repeated: boolean,
            isMap: boolean,
            mapKeyType?: string,
            mapValueType?: string
        }[] = [];

        // 分割字段定义，按行处理
        const lines = messageBody.split(/[\r\n;]+/).map(line => line.trim()).filter(Boolean);

        for (const line of lines) {
            // 跳过纯注释行和保留字段
            if (line.startsWith('//') || line.startsWith('reserved')) {
                continue;
            }

            // 提取行中的注释部分
            const commentIndex = line.indexOf('//');
            const codeLine = commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim();
            if (!codeLine) continue;

            // 处理 map 类型
            const mapMatch = codeLine.match(/map\s*<\s*(\w+)\s*,\s*(\w+)\s*>\s*(\w+)\s*=\s*\d+/);
            if (mapMatch) {
                const mapKeyType = mapMatch[1];
                const mapValueType = mapMatch[2];
                const fieldName = mapMatch[3];

                fields.push({
                    name: fieldName,
                    type: `map<${mapKeyType},${mapValueType}>`,
                    repeated: false,
                    isMap: true,
                    mapKeyType,
                    mapValueType
                });
                continue;
            }

            // 处理普通字段和重复字段
            const fieldMatch = codeLine.match(/(repeated)?\s*(\w+(?:\.\w+)?)\s+(\w+)\s*=\s*\d+/);
            if (fieldMatch) {
                const repeated = !!fieldMatch[1];
                const fieldType = fieldMatch[2];
                const fieldName = fieldMatch[3];

                fields.push({
                    name: fieldName,
                    type: fieldType,
                    repeated,
                    isMap: false
                });
            }
        }

        messages.push({
            name: messageName,
            fields
        });
    }

    return messages;
}

function protoTypeToGoType(protoType: string, repeated: boolean, isMap: boolean = false, mapKeyType?: string, mapValueType?: string): string {
    if (isMap && mapKeyType && mapValueType) {
        return `map[${protoTypeToGoType(mapKeyType, false)}]${protoTypeToGoType(mapValueType, false)}`;
    }

    const typeMap: Record<string, string> = {
        'double': 'float64',
        'float': 'float32',
        'int32': 'int32',
        'int64': 'int64',
        'uint32': 'uint32',
        'uint64': 'uint64',
        'sint32': 'int32',
        'sint64': 'int64',
        'fixed32': 'uint32',
        'fixed64': 'uint64',
        'sfixed32': 'int32',
        'sfixed64': 'int64',
        'bool': 'bool',
        'string': 'string',
        'bytes': '[]byte',
        'google.protobuf.Timestamp': 'time.Time'
    };

    const goType = typeMap[protoType] || protoType;

    if (repeated) {
        return `[]${goType}`;
    }

    return goType;
}

function extractGoStructs(goCode: string): { name: string, fields: { name: string, type: string }[] }[] {
    const structs: { name: string, fields: { name: string, type: string }[] }[] = [];

    // 提取结构体定义
    const structRegex = /type\s+(\w+)\s+struct\s*{([^}]*)}/gs;
    let match;

    while ((match = structRegex.exec(goCode)) !== null) {
        const structName = match[1];
        const structBody = match[2];

        const fields: { name: string, type: string }[] = [];

        // 分割字段定义
        const lines = structBody.split('\n').map(line => line.trim()).filter(Boolean);

        for (const line of lines) {
            // 跳过注释行
            if (line.startsWith('//')) continue;

            // 匹配字段定义，如 "Name string `json:\"name\"`"
            const fieldMatch = line.match(/(\w+)\s+([^`]+)(?:`.*`)?/);
            if (!fieldMatch) continue;

            const fieldName = fieldMatch[1];
            const fieldType = fieldMatch[2].trim();

            fields.push({ name: fieldName, type: fieldType });
        }

        structs.push({ name: structName, fields });
    }

    return structs;
}

function goTypeToSqlType(goType: string): string {
    const typeMap: Record<string, string> = {
        'int': 'INT',
        'int8': 'TINYINT',
        'int16': 'SMALLINT',
        'int32': 'INT',
        'int64': 'BIGINT',
        'uint': 'INT UNSIGNED',
        'uint8': 'TINYINT UNSIGNED',
        'uint16': 'SMALLINT UNSIGNED',
        'uint32': 'INT UNSIGNED',
        'uint64': 'BIGINT UNSIGNED',
        'float32': 'FLOAT',
        'float64': 'DOUBLE',
        'string': 'VARCHAR(255)',
        'bool': 'BOOLEAN',
        'time.Time': 'DATETIME',
        '[]byte': 'BLOB',
        'json.RawMessage': 'JSON'
    };

    // 处理指针类型
    if (goType.startsWith('*')) {
        return goTypeToSqlType(goType.substring(1));
    }

    // 处理数组类型
    if (goType.startsWith('[]')) {
        return 'TEXT';
    }

    // 处理 map 类型
    if (goType.startsWith('map[')) {
        return 'JSON';
    }

    return typeMap[goType] || 'VARCHAR(255)';
}

function goTypeToProtoType(goType: string): string {
    const typeMap: Record<string, string> = {
        'int': 'int32',
        'int8': 'int32',
        'int16': 'int32',
        'int32': 'int32',
        'int64': 'int64',
        'uint': 'uint32',
        'uint8': 'uint32',
        'uint16': 'uint32',
        'uint32': 'uint32',
        'uint64': 'uint64',
        'float32': 'float',
        'float64': 'double',
        'string': 'string',
        'bool': 'bool',
        'time.Time': 'google.protobuf.Timestamp',
        '[]byte': 'bytes',
        'json.RawMessage': 'string'
    };

    // 处理指针类型
    if (goType.startsWith('*')) {
        return goTypeToProtoType(goType.substring(1));
    }

    // 处理数组类型
    if (goType.startsWith('[]')) {
        return goTypeToProtoType(goType.substring(2));
    }

    // 处理 map 类型
    if (goType.startsWith('map[')) {
        return 'string'; // 简化处理，实际应该解析 key 和 value 类型
    }

    return typeMap[goType] || 'string';
}

// ==================== 其他语言的转换函数 ====================
// 这些函数目前只返回占位符，实际实现可以根据需要添加

export function sqlToJava(sql: string, options: ConversionOptions): string {
    try {
        // 解析 SQL CREATE TABLE 语句
        const tableName = extractTableName(sql);
        const className = camelCase(tableName, true);
        const columns = extractColumns(sql);

        // 生成 Java 类
        let javaClass = `package ${options.packageName};\n\n`;

        // 添加必要的导入
        const imports = new Set<string>();
        imports.add('import java.util.*;');

        // 检查是否需要导入日期类型
        if (columns.some(col =>
            col.type.toUpperCase().includes('DATE') ||
            col.type.toUpperCase().includes('TIME'))) {
            imports.add('import java.time.*;');
            imports.add('import java.sql.Timestamp;');
        }

        // 添加导入语句
        imports.forEach(imp => {
            javaClass += `${imp}\n`;
        });
        javaClass += '\n';

        // 添加类注释
        javaClass += `/**\n * ${className} entity generated from database table ${tableName}\n */\n`;

        // 添加类定义
        javaClass += `public class ${className} {\n\n`;

        // 添加字段
        for (const col of columns) {
            const fieldName = camelCase(col.name, false);
            const fieldType = sqlTypeToJavaType(col.type);

            // 添加字段注释
            javaClass += `    /**\n     * ${col.name}`;
            if (col.isPrimary) javaClass += ' (Primary Key)';
            if (col.isAutoIncrement) javaClass += ' (Auto Increment)';
            javaClass += `\n     */\n`;

            // 添加字段定义
            javaClass += `    private ${fieldType} ${fieldName};\n\n`;
        }

        // 添加无参构造函数
        javaClass += `    public ${className}() {\n    }\n\n`;

        // 添加全参构造函数
        javaClass += `    public ${className}(`;
        const constructorParams = columns.map(col =>
            `${sqlTypeToJavaType(col.type)} ${camelCase(col.name, false)}`
        ).join(', ');
        javaClass += `${constructorParams}) {\n`;

        for (const col of columns) {
            const fieldName = camelCase(col.name, false);
            javaClass += `        this.${fieldName} = ${fieldName};\n`;
        }
        javaClass += `    }\n\n`;

        // 添加 getter 和 setter 方法
        for (const col of columns) {
            const fieldName = camelCase(col.name, false);
            const fieldType = sqlTypeToJavaType(col.type);
            const capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

            // Getter
            javaClass += `    public ${fieldType} get${capitalizedFieldName}() {\n`;
            javaClass += `        return ${fieldName};\n`;
            javaClass += `    }\n\n`;

            // Setter
            javaClass += `    public void set${capitalizedFieldName}(${fieldType} ${fieldName}) {\n`;
            javaClass += `        this.${fieldName} = ${fieldName};\n`;
            javaClass += `    }\n\n`;
        }

        // 添加 toString 方法
        javaClass += `    @Override\n`;
        javaClass += `    public String toString() {\n`;
        javaClass += `        return "${className}{" +\n`;

        const toStringParts = columns.map((col, index) => {
            const fieldName = camelCase(col.name, false);
            const prefix = index === 0 ? "" : "                + \", ";
            return `${prefix}${fieldName}=" + ${fieldName}`;
        }).join(" +\n");

        javaClass += `            ${toStringParts} +\n`;
        javaClass += `            "}";\n`;
        javaClass += `    }\n`;

        // 结束类定义
        javaClass += `}\n`;

        return javaClass;
    } catch (e) {
        throw new Error(`Failed to convert SQL to Java: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// 添加 SQL 类型到 Java 类型的转换函数
function sqlTypeToJavaType(sqlType: string): string {
    const typeMap: Record<string, string> = {
        'INT': 'Integer',
        'INTEGER': 'Integer',
        'TINYINT': 'Byte',
        'SMALLINT': 'Short',
        'MEDIUMINT': 'Integer',
        'BIGINT': 'Long',
        'FLOAT': 'Float',
        'DOUBLE': 'Double',
        'DECIMAL': 'BigDecimal',
        'CHAR': 'String',
        'VARCHAR': 'String',
        'TEXT': 'String',
        'LONGTEXT': 'String',
        'DATE': 'LocalDate',
        'DATETIME': 'LocalDateTime',
        'TIMESTAMP': 'Timestamp',
        'BOOLEAN': 'Boolean',
        'BOOL': 'Boolean',
        'BLOB': 'byte[]',
        'JSON': 'String',
    };

    // 处理带括号的类型，如 VARCHAR(255)
    const baseType = sqlType.split('(')[0].toUpperCase();

    // 处理 TINYINT(1)，通常用作布尔值
    if (baseType === 'TINYINT' && sqlType.includes('(1)')) {
        return 'Boolean';
    }

    return typeMap[baseType] || 'Object';
}

export function protoToJava(proto: string, options: ConversionOptions): string {
    return `// Java class generated from Proto
package ${options.packageName};

public class ${extractProtoMessages(proto)[0]?.name || "ProtoClass"} {
    // TODO: Implement Proto to Java conversion
}`;
}

export function javaToSql(javaCode: string, options: ConversionOptions): string {
    return `-- SQL generated from Java
-- TODO: Implement Java to SQL conversion
CREATE TABLE example (
  id INT PRIMARY KEY
);`;
}

export function javaToProto(javaCode: string, options: ConversionOptions): string {
    return `syntax = "proto3";

package ${options.packageName};

// TODO: Implement Java to Proto conversion
message Example {
  int32 id = 1;
}`;
}

export function sqlToPython(sql: string, options: ConversionOptions): string {
    try {
        // 解析 SQL CREATE TABLE 语句
        const tableName = extractTableName(sql);
        const className = camelCase(tableName, true);
        const columns = extractColumns(sql);

        // 生成 Python 类
        let pythonClass = `# -*- coding: utf-8 -*-\n`;
        pythonClass += `# ${className} model generated from database table ${tableName}\n\n`;

        // 添加必要的导入
        pythonClass += `from dataclasses import dataclass\n`;
        pythonClass += `from typing import Optional, List, Dict, Any\n`;

        // 检查是否需要导入日期类型
        if (columns.some(col =>
            col.type.toUpperCase().includes('DATE') ||
            col.type.toUpperCase().includes('TIME'))) {
            pythonClass += `from datetime import datetime, date\n`;
        }

        pythonClass += `\n\n`;

        // 添加类定义
        pythonClass += `@dataclass\n`;
        pythonClass += `class ${className}:\n`;
        pythonClass += `    """${className} model class\n\n`;
        pythonClass += `    Represents data from table ${tableName}\n`;
        pythonClass += `    """\n\n`;

        // 添加字段
        for (const col of columns) {
            const fieldName = snakeCase(col.name);
            const fieldType = sqlTypeToPythonType(col.type);
            const nullable = !col.isPrimary && col.defaultValue === null;

            // 添加字段注释
            pythonClass += `    # ${col.name}`;
            if (col.isPrimary) pythonClass += ' (Primary Key)';
            if (col.isAutoIncrement) pythonClass += ' (Auto Increment)';
            pythonClass += `\n`;

            // 添加字段定义
            if (nullable) {
                pythonClass += `    ${fieldName}: Optional[${fieldType}] = None\n`;
            } else {
                pythonClass += `    ${fieldName}: ${fieldType}\n`;
            }
        }

        // 添加 __str__ 方法
        pythonClass += `\n    def __str__(self) -> str:\n`;
        pythonClass += `        return f"${className}(`;

        const strParts = columns.map(col => {
            const fieldName = snakeCase(col.name);
            return `${fieldName}={self.${fieldName}}`;
        }).join(', ');

        pythonClass += `${strParts})"\n`;

        // 添加 to_dict 方法
        pythonClass += `\n    def to_dict(self) -> Dict[str, Any]:\n`;
        pythonClass += `        """Convert instance to dictionary\n\n`;
        pythonClass += `        Returns:\n`;
        pythonClass += `            Dict[str, Any]: Dictionary representation of the instance\n`;
        pythonClass += `        """\n`;
        pythonClass += `        return {\n`;

        const dictParts = columns.map(col => {
            const fieldName = snakeCase(col.name);
            return `            "${col.name}": self.${fieldName}`;
        }).join(',\n');

        pythonClass += `${dictParts}\n`;
        pythonClass += `        }\n`;

        // 添加 from_dict 静态方法
        pythonClass += `\n    @staticmethod\n`;
        pythonClass += `    def from_dict(data: Dict[str, Any]) -> "${className}":\n`;
        pythonClass += `        """Create instance from dictionary\n\n`;
        pythonClass += `        Args:\n`;
        pythonClass += `            data (Dict[str, Any]): Dictionary with instance data\n\n`;
        pythonClass += `        Returns:\n`;
        pythonClass += `            ${className}: New instance\n`;
        pythonClass += `        """\n`;
        pythonClass += `        return ${className}(\n`;

        const fromDictParts = columns.map(col => {
            const fieldName = snakeCase(col.name);
            return `            ${fieldName}=data.get("${col.name}")`;
        }).join(',\n');

        pythonClass += `${fromDictParts}\n`;
        pythonClass += `        )\n`;

        return pythonClass;
    } catch (e) {
        throw new Error(`Failed to convert SQL to Python: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// SQL 类型到 Python 类型的转换函数
function sqlTypeToPythonType(sqlType: string): string {
    const typeMap: Record<string, string> = {
        'INT': 'int',
        'INTEGER': 'int',
        'TINYINT': 'int',
        'SMALLINT': 'int',
        'MEDIUMINT': 'int',
        'BIGINT': 'int',
        'FLOAT': 'float',
        'DOUBLE': 'float',
        'DECIMAL': 'float',
        'CHAR': 'str',
        'VARCHAR': 'str',
        'TEXT': 'str',
        'LONGTEXT': 'str',
        'DATE': 'date',
        'DATETIME': 'datetime',
        'TIMESTAMP': 'datetime',
        'BOOLEAN': 'bool',
        'BOOL': 'bool',
        'BLOB': 'bytes',
        'JSON': 'Dict[str, Any]',
    };

    // 处理带括号的类型，如 VARCHAR(255)
    const baseType = sqlType.split('(')[0].toUpperCase();

    // 处理 TINYINT(1)，通常用作布尔值
    if (baseType === 'TINYINT' && sqlType.includes('(1)')) {
        return 'bool';
    }

    return typeMap[baseType] || 'Any';
}

export function protoToPython(proto: string, options: ConversionOptions): string {
    try {
        // 解析 Proto 定义
        const messages = extractProtoMessages(proto);
        if (!messages.length) {
            throw new Error("No message definitions found in Proto");
        }

        // 生成 Python 类
        let pythonCode = `# -*- coding: utf-8 -*-\n`;
        pythonCode += `# Python classes generated from Protocol Buffers\n\n`;

        // 添加必要的导入
        pythonCode += `from dataclasses import dataclass\n`;
        pythonCode += `from typing import Optional, List, Dict, Any, Union\n\n`;

        // 为每个消息生成一个类
        for (const msg of messages) {
            pythonCode += `@dataclass\n`;
            pythonCode += `class ${msg.name}:\n`;
            pythonCode += `    """${msg.name} message class\n\n`;
            pythonCode += `    Generated from Protocol Buffers definition\n`;
            pythonCode += `    """\n\n`;

            // 添加字段
            for (const field of msg.fields) {
                const fieldName = snakeCase(field.name);
                let fieldType;

                if (field.isMap) {
                    const keyType = protoTypeToPythonType(field.mapKeyType || 'string');
                    const valueType = protoTypeToPythonType(field.mapValueType || 'string');
                    fieldType = `Dict[${keyType}, ${valueType}]`;
                } else if (field.repeated) {
                    fieldType = `List[${protoTypeToPythonType(field.type)}]`;
                } else {
                    fieldType = protoTypeToPythonType(field.type);
                }

                // 添加字段注释和定义
                pythonCode += `    # ${field.name}\n`;
                pythonCode += `    ${fieldName}: ${fieldType} = `;

                // 添加默认值
                if (field.isMap) {
                    pythonCode += `{}\n`;
                } else if (field.repeated) {
                    pythonCode += `[]\n`;
                } else {
                    pythonCode += `None\n`;
                }
            }

            // 添加 __str__ 方法
            pythonCode += `\n    def __str__(self) -> str:\n`;
            pythonCode += `        return f"${msg.name}(`;

            const strParts = msg.fields.map(field => {
                const fieldName = snakeCase(field.name);
                return `${fieldName}={self.${fieldName}}`;
            }).join(', ');

            pythonCode += `${strParts})"\n\n`;
        }

        return pythonCode;
    } catch (e) {
        throw new Error(`Failed to convert Proto to Python: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// Proto 类型到 Python 类型的转换函数
function protoTypeToPythonType(protoType: string): string {
    const typeMap: Record<string, string> = {
        'double': 'float',
        'float': 'float',
        'int32': 'int',
        'int64': 'int',
        'uint32': 'int',
        'uint64': 'int',
        'sint32': 'int',
        'sint64': 'int',
        'fixed32': 'int',
        'fixed64': 'int',
        'sfixed32': 'int',
        'sfixed64': 'int',
        'bool': 'bool',
        'string': 'str',
        'bytes': 'bytes',
        'google.protobuf.Timestamp': 'datetime',
    };

    return typeMap[protoType] || protoType;
}

export function pythonToSql(pythonCode: string, options: ConversionOptions): string {
    return `-- SQL generated from Python
-- TODO: Implement Python to SQL conversion
CREATE TABLE example (
  id INT PRIMARY KEY
);`;
}

export function pythonToProto(pythonCode: string, options: ConversionOptions): string {
    return `syntax = "proto3";

package ${options.packageName};

// TODO: Implement Python to Proto conversion
message Example {
  int32 id = 1;
}`;
}

export function sqlToTypeScript(sql: string, options: ConversionOptions): string {
    try {
        // 解析 SQL CREATE TABLE 语句
        const tableName = extractTableName(sql);
        const interfaceName = camelCase(tableName, true);
        const columns = extractColumns(sql);

        // 生成 TypeScript 接口
        let tsInterface = `/**\n * ${interfaceName} interface generated from database table ${tableName}\n */\n`;
        tsInterface += `export interface ${interfaceName} {\n`;

        // 添加字段
        for (const col of columns) {
            const fieldName = camelCase(col.name, false);
            const fieldType = sqlTypeToTypeScriptType(col.type);
            const nullable = !col.isPrimary && col.defaultValue === null;

            // 添加字段注释
            tsInterface += `  /**\n   * ${col.name}`;
            if (col.isPrimary) tsInterface += ' (Primary Key)';
            if (col.isAutoIncrement) tsInterface += ' (Auto Increment)';
            tsInterface += `\n   */\n`;

            // 添加字段定义
            tsInterface += `  ${fieldName}${nullable ? '?' : ''}: ${fieldType};\n\n`;
        }

        tsInterface += `}\n\n`;

        // 添加工厂函数
        tsInterface += `/**\n * Create a new ${interfaceName} instance with default values\n */\n`;
        tsInterface += `export function create${interfaceName}(): ${interfaceName} {\n`;
        tsInterface += `  return {\n`;

        const defaultValues = columns.map(col => {
            const fieldName = camelCase(col.name, false);
            const defaultValue = getTypeScriptDefaultValue(sqlTypeToTypeScriptType(col.type));
            return `    ${fieldName}: ${defaultValue}`;
        }).join(',\n');

        tsInterface += `${defaultValues}\n`;
        tsInterface += `  };\n`;
        tsInterface += `}\n`;

        return tsInterface;
    } catch (e) {
        throw new Error(`Failed to convert SQL to TypeScript: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// SQL 类型到 TypeScript 类型的转换函数
function sqlTypeToTypeScriptType(sqlType: string): string {
    const typeMap: Record<string, string> = {
        'INT': 'number',
        'INTEGER': 'number',
        'TINYINT': 'number',
        'SMALLINT': 'number',
        'MEDIUMINT': 'number',
        'BIGINT': 'number',
        'FLOAT': 'number',
        'DOUBLE': 'number',
        'DECIMAL': 'number',
        'CHAR': 'string',
        'VARCHAR': 'string',
        'TEXT': 'string',
        'LONGTEXT': 'string',
        'DATE': 'Date',
        'DATETIME': 'Date',
        'TIMESTAMP': 'Date',
        'BOOLEAN': 'boolean',
        'BOOL': 'boolean',
        'BLOB': 'Uint8Array',
        'JSON': 'Record<string, any>',
    };

    // 处理带括号的类型，如 VARCHAR(255)
    const baseType = sqlType.split('(')[0].toUpperCase();

    // 处理 TINYINT(1)，通常用作布尔值
    if (baseType === 'TINYINT' && sqlType.includes('(1)')) {
        return 'boolean';
    }

    return typeMap[baseType] || 'any';
}

// 获取 TypeScript 默认值
function getTypeScriptDefaultValue(tsType: string): string {
    switch (tsType) {
        case 'number':
            return '0';
        case 'string':
            return '""';
        case 'boolean':
            return 'false';
        case 'Date':
            return 'new Date()';
        case 'Uint8Array':
            return 'new Uint8Array()';
        case 'Record<string, any>':
            return '{}';
        default:
            return 'null';
    }
}

export function protoToTypeScript(proto: string, options: ConversionOptions): string {
    try {
        // 解析 Proto 定义
        const messages = extractProtoMessages(proto);
        if (!messages.length) {
            throw new Error("No message definitions found in Proto");
        }

        // 生成 TypeScript 接口
        let tsCode = `/**\n * TypeScript interfaces generated from Protocol Buffers\n */\n\n`;

        // 为每个消息生成一个接口
        for (const msg of messages) {
            tsCode += `/**\n * ${msg.name} message interface\n */\n`;
            tsCode += `export interface ${msg.name} {\n`;

            // 添加字段
            for (const field of msg.fields) {
                const fieldName = camelCase(field.name, false);
                let fieldType;

                if (field.isMap) {
                    const keyType = protoTypeToTypeScriptType(field.mapKeyType || 'string');
                    const valueType = protoTypeToTypeScriptType(field.mapValueType || 'string');
                    fieldType = `Record<${keyType}, ${valueType}>`;
                } else if (field.repeated) {
                    fieldType = `${protoTypeToTypeScriptType(field.type)}[]`;
                } else {
                    fieldType = protoTypeToTypeScriptType(field.type);
                }

                // 添加字段注释和定义
                tsCode += `  /** ${field.name} */\n`;
                tsCode += `  ${fieldName}?: ${fieldType};\n\n`;
            }

            tsCode += `}\n\n`;

            // 添加工厂函数
            tsCode += `/**\n * Create a new ${msg.name} instance with default values\n */\n`;
            tsCode += `export function create${msg.name}(): ${msg.name} {\n`;
            tsCode += `  return {\n`;

            const defaultValues = msg.fields.map(field => {
                const fieldName = camelCase(field.name, false);
                let defaultValue;

                if (field.isMap) {
                    defaultValue = '{}';
                } else if (field.repeated) {
                    defaultValue = '[]';
                } else {
                    defaultValue = getTypeScriptDefaultValue(protoTypeToTypeScriptType(field.type));
                }

                return `    ${fieldName}: ${defaultValue}`;
            }).join(',\n');

            tsCode += `${defaultValues}\n`;
            tsCode += `  };\n`;
            tsCode += `}\n\n`;
        }

        return tsCode;
    } catch (e) {
        throw new Error(`Failed to convert Proto to TypeScript: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// Proto 类型到 TypeScript 类型的转换函数
function protoTypeToTypeScriptType(protoType: string): string {
    const typeMap: Record<string, string> = {
        'double': 'number',
        'float': 'number',
        'int32': 'number',
        'int64': 'number',
        'uint32': 'number',
        'uint64': 'number',
        'sint32': 'number',
        'sint64': 'number',
        'fixed32': 'number',
        'fixed64': 'number',
        'sfixed32': 'number',
        'sfixed64': 'number',
        'bool': 'boolean',
        'string': 'string',
        'bytes': 'Uint8Array',
        'google.protobuf.Timestamp': 'Date',
    };

    return typeMap[protoType] || protoType;
}

export function typeScriptToSql(tsCode: string, options: ConversionOptions): string {
    return `-- SQL generated from TypeScript
-- TODO: Implement TypeScript to SQL conversion
CREATE TABLE example (
  id INT PRIMARY KEY
);`;
}

export function typeScriptToProto(tsCode: string, options: ConversionOptions): string {
    return `syntax = "proto3";

package ${options.packageName};

// TODO: Implement TypeScript to Proto conversion
message Example {
  int32 id = 1;
}`;
} 