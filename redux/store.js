const { configureStore, getDefaultMiddleware } = require("@reduxjs/toolkit");

const { groupsSlice } = require("./groupsSlice");

module.exports = configureStore({
	reducer: {
		groups: groupsSlice.reducer
	},
	middleware: getDefaultMiddleware({
		immutableCheck: false,
		serializableCheck: false
	}),
	devTools: false
});
