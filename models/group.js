const mongoose = require("mongoose");

const reqString = {
    type: String,
    required: true
}

const reqMember = {
    displayName: reqString,
    id: reqString,
    status: reqString
}

const reqInt = {
    type: Number,
    required: true
}

const groupSchema = new mongoose.Schema({
    guildId: reqString,
    channelId: reqString,
    messageId: reqString,
    title: reqString,
    size: reqInt,
    members: [reqMember]
});

module.exports = mongoose.model('group-schema', groupSchema);