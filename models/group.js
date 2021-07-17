const { model, Schema } = require("mongoose");

const reqString = {
	type: String,
	required: true
};

const reqInt = {
	type: Number,
	required: true
};

const reqMember = {
	displayName: reqString,
	id: reqString,
	status: reqString
};

const groupSchema = new Schema({
	creatorId: reqString,
	creatorDisplayName: reqString,
	guildId: reqString,
	channelId: reqString,
	messageId: reqString,
	title: reqString,
	size: reqInt,
	time: reqString,
	members: [reqMember]
});

module.exports = model("group-schema", groupSchema);
