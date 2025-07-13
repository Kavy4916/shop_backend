const getISTDateString = () =>{
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    nowIST.setUTCHours(0, 0, 0, 0);
    return nowIST.toISOString().split('T')[0];
}

export {getISTDateString};