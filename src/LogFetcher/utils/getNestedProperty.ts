const getNestedProperty = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export default getNestedProperty;
