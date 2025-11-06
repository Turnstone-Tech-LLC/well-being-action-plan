/**
 * Represents the three zones of emotional regulation in the well-being action plan.
 *
 * @enum {string}
 * @property {string} Green - Feeling good, stable emotional state
 * @property {string} Yellow - Warning signs present, elevated stress or concern
 * @property {string} Red - Crisis state, immediate support needed
 */
export enum ZoneType {
  Green = 'green',
  Yellow = 'yellow',
  Red = 'red',
}

/**
 * Type guard to check if a string is a valid ZoneType
 */
export function isZoneType(value: unknown): value is ZoneType {
  return typeof value === 'string' && Object.values(ZoneType).includes(value as ZoneType);
}
