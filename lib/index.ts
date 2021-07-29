import 'reflect-metadata';

export * from './Bento';
export * from './Globals';

export * from './application/Application';
export * from './application/interfaces/ApplicationConfig';
export * from './application/interfaces/ApplicationState';

export { ChildOf } from './decorators/ChildOf';
export { Inject } from './decorators/Inject';
export { Parent } from './decorators/Parent';
export { Subscribe } from './decorators/Subscribe';
export { Variable } from './decorators/Variable';

export * from './entities/api/ComponentAPI';
export * from './entities/api/EntityAPI';
export * from './entities/api/PluginAPI';
export * from './entities/interfaces/Component';
export * from './entities/interfaces/Entity';
export * from './entities/interfaces/Plugin';
export * from './entities/types/ComponentReference';
export * from './entities/types/EntityReference';
export * from './entities/types/PluginReference';

// TODO: Replace Errors
export * from './errors/ApiError';
export * from './errors/BentoError';
export * from './errors/EntityError';
export * from './errors/EntityLoadError';
export * from './errors/EntityRegistrationError';
export * from './errors/ValidatorRegistrationError';

export * from './interfaces/BentoState';
export * from './interfaces/EventEmitterLike';

export * from './plugins/cfg/VariableFileLoader';
export * from './plugins/cfg/VariableLoader';
export * from './plugins/loaders/EntityLoader';
export * from './plugins/loaders/FSEntityLoader';

export * from './variables/interfaces/VariableDefinition';
