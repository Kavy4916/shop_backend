const getISTDateString = () =>{
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    nowIST.setUTCHours(0, 0, 0, 0);
    return nowIST.toISOString().split('T')[0];
}

const getOldChangesFields = (original, current) => {
  const old = {};
  const changes = {};
  for (const key in current) {
    if (current[key] !== original[key]) {
      changes[key] = current[key];
      old[key] = original[key];
    }
  }
  return [old, changes];
};

export {getISTDateString, getOldChangesFields};