import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Column {
  '_type' : ColumnTypes,
  'filters' : Array<Filter>,
  'permissions' : Array<ColumnPermission>,
  'name' : string,
  'formula' : [] | [string],
}
export interface ColumnPermission {
  '_type' : PermissionType,
  'granted_to' : Array<Principal>,
}
export type ColumnTypes = { 'Tag' : null } |
  { 'Date' : null } |
  { 'File' : null } |
  { 'Text' : null } |
  { 'Person' : null } |
  { 'Category' : null } |
  { 'Number' : null };
export type ContentData = { 'Comment' : string } |
  { 'Image' : BigUint64Array | bigint[] } |
  { 'Table' : Table };
export interface ContentNode {
  'id' : bigint,
  '_type' : string,
  'data' : [] | [ContentData],
  'text' : string,
  'children' : BigUint64Array | bigint[],
  'parent' : [] | [bigint],
}
export interface FileNode {
  'id' : bigint,
  'content' : bigint,
  'name' : string,
  'children' : BigUint64Array | bigint[],
  'parent' : [] | [bigint],
}
export interface Filter {
  'name' : string,
  'operations' : Array<Operation>,
  'formula' : [] | [string],
}
export type Operation = { 'Equal' : null } |
  { 'Contains' : null } |
  { 'Bigger' : null } |
  { 'BiggerOrEqual' : null };
export type PermissionType = { 'CanRead' : null } |
  { 'CanUpdate' : null };
export interface RegisterUser { 'name' : string, 'description' : string }
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : User } |
  { 'Err' : string };
export interface Row { 'data' : Array<[string, string]> }
export interface Table { 'rows' : Array<Row>, 'columns' : Array<Column> }
export interface User { 'name' : string, 'description' : string }
export interface _SERVICE {
  'content_updates' : ActorMethod<[bigint, [] | [bigint], string], Result>,
  'create_new_file' : ActorMethod<[string, [] | [bigint]], FileNode>,
  'delete_file' : ActorMethod<[bigint], [] | [FileNode]>,
  'get_all_contracts' : ActorMethod<[], string>,
  'get_all_files' : ActorMethod<[], [] | [Array<[bigint, FileNode]>]>,
  'get_all_files_content' : ActorMethod<
    [],
    Array<[bigint, Array<[bigint, ContentNode]>]>
  >,
  'get_file' : ActorMethod<[bigint], [] | [FileNode]>,
  'get_file_content' : ActorMethod<
    [bigint],
    [] | [Array<[bigint, ContentNode]>]
  >,
  'register' : ActorMethod<[RegisterUser], Result_1>,
  'rename_file' : ActorMethod<[bigint, string], boolean>,
}
