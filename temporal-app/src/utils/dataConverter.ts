import { defaultDataConverter } from '@temporalio/common';

/**
 * Returns the data converter for serializing/deserializing workflow data
 */
export function getDataConverter() {
  // Use the default data converter
  return defaultDataConverter;
}