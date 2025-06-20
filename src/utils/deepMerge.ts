// Deep merge function to ensure all nested properties are properly initialized
export function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) {
    return target;
  }
  
  if (typeof target !== 'object' || typeof source !== 'object') {
    return source;
  }
  
  if (Array.isArray(source)) {
    return source;
  }
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      // If source[key] is null or undefined, preserve the target[key] instead of overwriting
      if (source[key] === null || source[key] === undefined) {
        // Keep the target value as-is
        continue;
      }
      
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}