/** Parse parameters
 * @example `q=0.3;a=12`
 * @param {String} str
 * @returns {Record<string, unknown>}
 */
export const parseParams = (str) =>
  str.split(";").reduce((acc, item) => {
    const [key, value] = item.split("=");
    if (key) {
      acc[key.trim()] = value !== undefined ? value.trim() : true;
    }

    return acc;
  }, {});

/** Encode parameters
 * @example `q=0.3;a=12`
 * @param {Record<string, unknown>} params
 * @returns {String}
 */
export const encodeParams = (params) =>
  Object.entries(params)
    .filter(([_, value]) => !!value)
    .map(([key, value]) => `${key}=${value}`)
    .join(";");
