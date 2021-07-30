const groupStatus = require("../constants/groupStatus");

const countStatusInGroup = (group, statusType) => {
	let confirmedCount = 0;
	for (const member in group.members) {
		if (group.members[member].status === statusType) {
			confirmedCount++;
		}
	}
	return confirmedCount;
};

module.exports = {
	countStatusInGroup
};
