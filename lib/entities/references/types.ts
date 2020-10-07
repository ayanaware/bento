import { Component, Entity, Plugin } from '../interfaces';

export type ComponentReference = string | Function | Component;
export type PluginReference = string | Function | Plugin;
export type EntityReference = string | Function | Entity;
