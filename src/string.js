import { writeFile } from 'node:fs/promises';

/**
 * Save a string to file
 *
 * @param {string} fpath
 * @param {string} data
 */
const save = async ( fpath, data ) => {
  try {
    await writeFile(fpath, data);
  } catch (e) {
    console.error( 'Error saving to file' );
    console.error( e );
  }
}

export {
 save
};