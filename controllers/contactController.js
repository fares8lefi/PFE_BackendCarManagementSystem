const contactSchema = require("../models/contactSchema");

module.exports.createMessage = async (req, res) => {
  try {
    const { name, email, telephone, sujet, message } = req.body;
    const statut = "non_lu";
    const messages = await contactSchema.create({
      name,
      email,
      telephone,
      sujet,
      message,
      statut,
    });
    res.status(200).json({ messages });
  } catch (error) {
    console.log(500);
    res.status(500).json({ message: error.message });
  }
};

module.exports.getAllMessages = async (req, res) => {
  try {
    const messages = await contactSchema.find().sort({ dateEnvoi: -1 });
    res.status(200).json(messages || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.MarquerAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedMessage = await contactSchema.findByIdAndUpdate(
      id,
      { statut: "lu" },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message,});
  }
};
