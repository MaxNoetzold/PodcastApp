let router = require('express').Router();

router.get("/", function(req, res) {
	res.render("pages/main/archiveLayout.pug", { title: "Main" });
});

module.exports = router;
