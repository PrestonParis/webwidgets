import fs from 'node:fs/promises';
import path from 'node:path';
import type {
    SchemaSnapshot,
    SchemaTable,
} from '@/features/developer/schemas/infrastructureSchemas';
import { checkedAt, pathExists } from './infraUtils';

const root = process.cwd();

function parseColumnDefinitions(body: string): SchemaTable['columns'] {
    return body
        .split('\n')
        .map((line) => line.trim().replace(/,$/, ''))
        .filter((line) => line && !line.toLowerCase().startsWith('constraint'))
        .map((line) => {
            const parts = line.split(/\s+/);
            const name = parts[0]?.replaceAll('"', '') ?? 'unknown';
            const lower = line.toLowerCase();
            return {
                name,
                type: parts.slice(1, 3).join(' '),
                nullable: !lower.includes('not null'),
                ...(lower.includes('default')
                    ? { defaultValue: line.slice(lower.indexOf('default')) }
                    : {}),
            };
        });
}

export async function getSchemaFromMigrations(): Promise<SchemaSnapshot> {
    const migrationRoot = path.join(root, 'supabase', 'migrations');
    const tables = new Map<string, SchemaTable>();
    if (!(await pathExists(migrationRoot))) {
        return {
            status: 'unavailable',
            source: 'supabase/migrations',
            tables: [],
            detail: 'No Supabase migration directory exists.',
            checkedAt: checkedAt(),
            unavailableReason: 'integration_missing',
        };
    }

    const files = (await fs.readdir(migrationRoot))
        .filter((f) => f.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const source = await fs.readFile(
            path.join(migrationRoot, file),
            'utf8',
        );
        for (const match of source.matchAll(
            /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?\s*\(([\s\S]*?)\);/gi,
        )) {
            const schema = match[1] ?? 'public';
            const name = match[2] ?? 'unknown';
            tables.set(`${schema}.${name}`, {
                schema,
                name,
                columns: parseColumnDefinitions(match[3] ?? ''),
                relationships: [],
                policies: [],
                indexes: [],
            });
        }
        for (const match of source.matchAll(
            /create\s+policy\s+"?([^"\n]+)"?\s+on\s+"?(\w+)"?\.?"?(\w+)"?/gi,
        )) {
            const existing = tables.get(`public.${match[3] ?? match[2]}`);
            if (existing && match[1]) existing.policies.push(match[1]);
        }
        for (const match of source.matchAll(
            /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?("?[\w_]+"?)\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/gi,
        )) {
            const index = match[1]?.replaceAll('"', '');
            const existing = match[3]
                ? tables.get(`${match[2] ?? 'public'}.${match[3]}`)
                : undefined;
            if (existing && index) existing.indexes.push(index);
        }
        for (const match of source.matchAll(
            /foreign\s+key\s*\("?(\w+)"?\)\s+references\s+(?:"?(\w+)"?\.)?"?(\w+)"?\s*\("?(\w+)"?\)/gi,
        )) {
            const [, column, , referencesTable, referencesColumn] = match;
            if (!column || !referencesTable || !referencesColumn) continue;
            for (const table of tables.values()) {
                if (
                    source.includes('alter table') ||
                    source.includes(table.name)
                ) {
                    table.relationships.push({
                        column,
                        referencesTable,
                        referencesColumn,
                    });
                    break;
                }
            }
        }
    }

    return {
        status: tables.size ? 'healthy' : 'unavailable',
        source: 'supabase/migrations',
        tables: [...tables.values()].sort((a, b) =>
            `${a.schema}.${a.name}`.localeCompare(`${b.schema}.${b.name}`),
        ),
        detail: tables.size
            ? 'Schema metadata parsed from committed Supabase migrations; no production rows are read.'
            : 'No CREATE TABLE statements were discovered in migrations.',
        checkedAt: checkedAt(),
    };
}
