import { getAllTransactionLog, getDocumentCount } from "../services/transactionLogService.js";

const getAllTransactionLogController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Only populate essential fields
    const populate = [
      {
        path: 'customerId',
        select: '_id name'
    },
    {
        path: 'userId',
        select: '_id username'
    }
    ];
    const logs = await getAllTransactionLog({}, null, { createdAt: -1 }, limit, skip, populate);
    const total = await getDocumentCount({}, null);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalLogs: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getCustomerTransactionLogController = async (req, res) => {
  const { customerId } = req.params;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Only populate essential fields
    const populate = [
      {
        path: 'customerId',
        select: '_id name'
    },
    {
        path: 'userId',
        select: '_id username'
    }
    ];
    const logs = await getAllTransactionLog({ customerId }, null, { createdAt: -1 }, limit, skip, populate);
    const total = await getDocumentCount({ customerId }, null);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalLogs: total
    })
}catch(error){
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("error getting transaction log: ",error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export {
  getAllTransactionLogController,
  getCustomerTransactionLogController
};