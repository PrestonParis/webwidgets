import { productionBindingCatalog } from './bindings';
import { providerCapabilities } from './providerCapabilities';
import { CapabilityRegistry, capabilityKey } from './registry';
import { taskCapabilities } from './taskCapabilities';

const registrations = [...taskCapabilities, ...providerCapabilities];

export const productionCapabilityRegistry = new CapabilityRegistry(
    registrations,
    productionBindingCatalog,
);

export const PRODUCTION_CAPABILITY_KEYS = Object.freeze(
    registrations.map(({ name, version }) => capabilityKey(name, version)),
);
