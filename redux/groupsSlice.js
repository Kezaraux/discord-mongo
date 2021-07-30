const { createSlice, createEntityAdapter } = require("@reduxjs/toolkit");

// messageId: {
// channelId,
// guildId,
// 	title,
// 	size,
//  time,
//  creatorDisplayName,
// 	members: {
// 		id: {
// 			displayName,
// 			status
// 		}
// 	}
// }

const groupsAdapter = createEntityAdapter();
const groupsSelector = groupsAdapter.getSelectors((state) => state.groups);

const groupsSlice = createSlice({
	name: "groups",
	initialState: groupsAdapter.getInitialState(),
	reducers: {
		groupAdded: (state, action) => {
			groupsAdapter.addOne(state, action.payload);
		},
		groupRemoved: (state, action) => {
			groupsAdapter.removeOne(state, action.payload.id);
		},
		groupMembersSet: (state, action) => {
			const { id, members } = action.payload;
			const group = state.entities[id];
			if (group) {
				group.members = members;
			}
		},
		groupMemberAdded: (state, action) => {
			const { id, member } = action.payload;
			const group = state.entities[id];
			if (group) {
				// if (!Object.keys(group.members).includes(member.id)) {
				group.members[member.id] = { displayName: member.displayName, status: member.status };
				// }
			}
		},
		groupMemberRemoved: (state, action) => {
			const { id, member } = action.payload;
			const group = state.entities[id];
			if (group) {
				const newGroup = Object.keys(group.members).reduce((acc, val) => {
					if (val != member.id) {
						acc[val] = group.members[val];
					}
					return acc;
				}, {});
				group.members = newGroup;
			}
		}
	}
});

const { groupAdded, groupRemoved, groupMemberAdded, groupMemberRemoved, groupMembersSet } =
	groupsSlice.actions;

module.exports = {
	groupsSelector,
	groupsSlice,
	groupAdded,
	groupRemoved,
	groupMembersSet,
	groupMemberAdded,
	groupMemberRemoved
};
