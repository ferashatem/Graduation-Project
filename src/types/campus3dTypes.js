/**
 * @typedef {Object} Vector3
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} Size3D
 * @property {number} width
 * @property {number} height
 * @property {number} depth
 */

/**
 * @typedef {Object} BuildingSize3D
 * @property {number} width
 * @property {number} heightPerFloor
 * @property {number} depth
 */

/**
 * @typedef {Object} Building3D
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {Vector3} position3d
 * @property {BuildingSize3D} size3d
 * @property {number} floorsCount
 * @property {number} roomsPerFloor
 * @property {any} createdAt
 * @property {any} updatedAt
 */

/**
 * @typedef {Object} Floor3D
 * @property {string} id
 * @property {string} buildingId
 * @property {number} floorNumber
 * @property {string} label
 * @property {number} heightOffset
 * @property {any} createdAt
 * @property {any} updatedAt
 */

/**
 * @typedef {Object} GridPos
 * @property {number} col
 * @property {number} row
 */

/**
 * @typedef {Object} Room3D
 * @property {string} id
 * @property {string} buildingId
 * @property {string} floorId
 * @property {string} roomNumber
 * @property {string} name
 * @property {number} capacity
 * @property {string} label
 * @property {GridPos} gridPos
 * @property {Vector3} localPosition3d
 * @property {Size3D} size3d
 * @property {boolean} [isReserved]
 * @property {any} createdAt
 * @property {any} updatedAt
 */

export {};
