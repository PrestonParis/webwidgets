import type { DataSourceRegistryEntry } from '../types/synthesisDataSources';
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
