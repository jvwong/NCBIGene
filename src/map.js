import { writeFile, readFile } from 'node:fs/promises';

/**
 * Serialize a Map and save to file
 *
 * @param {string} fpath
 * @param {object} map
 */
const save = async ( fpath, map ) => {
  try {
    const data = JSON.stringify(Array.from(map.entries()));
    await writeFile(fpath, data);
  } catch (e) {
    console.error( 'Error saving Map to file' );
    console.error( err );
  }
}

/**
 * Load a serialized Map from file
 *
 * @param {string} fpath
 * @returns a Map
 */
const load = async fpath => {
  try {
    const raw = await readFile(fpath);
    return new Map(JSON.parse(raw));
  } catch (e) {
    console.error( 'Error loading Map from file' );
    console.error( err );
  }
};

export {
 save,
 load
};