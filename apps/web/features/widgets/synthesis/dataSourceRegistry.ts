import type { DataSourceRegistryEntry } from './dataSourceTypes';
import { DATA_SOURCE_REGISTRY } from './dataSources';
import {
    getDataSource,
    getDataSourcesByCategory,
    getDataSourceCategories,
} from './dataSourceUtils';

export type { DataSourceRegistryEntry };
export {
    DATA_SOURCE_REGISTRY,
    getDataSource,
    getDataSourcesByCategory,
    getDataSourceCategories,
};
