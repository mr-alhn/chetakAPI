const express = require("express");
const router = express.Router();
const User = require("../model/user");
const Premium = require("../model/premium");
const Library = require("../model/library");
const { Op, fn, col, literal } = require("sequelize");

router.get("/", async (req, res) => {
  try {
    const year = req.query.year || "2024";

    const users = await User.findAll();

    const latestUsers = await User.findAll({
      order: [["createdAt", "DESC"]],
      limit: 10,
    });
    const latestUserIds = latestUsers.map((user) => user.id);
    const premiumUserCount = await Premium.count({
      where: {
        userId: { [Op.in]: latestUserIds },
      },
    });
    const sales = await Library.findAll();
    let salesFromSubs = 0;
    let salesFromEcom = 0;
    for (const item of sales) {
      if (item.purchasedFrom === "Subscriptions") {
        ++salesFromSubs;
      } else {
        ++salesFromEcom;
      }
    }

    const usersActivities = await getUsersCountByMonthAndYear(year);
    const response = {
      status: true,
      message: "OK",
      dashboard: {
        listOfUsers: users.length,
        paidSubscriber: premiumUserCount,
        salesFromSubs,
        salesFromEcom,
      },
      latestUsers: latestUsers.map((user) => user.toJSON()),
      usersActivities,
    };

    res.status(200).json(response);
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: false, message: "Server Error" });
  }
});

async function getUsersCountByMonthAndYear(year) {
  try {
    const users = await User.findAll({
      where: {
        createdAt: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`],
        },
      },
    });

    const counts = Array(12).fill(0);

    users.forEach((user) => {
      const month = new Date(user.createdAt).getMonth();
      counts[month]++;
    });

    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    const result = monthNames.map((month, index) => ({
      month,
      count: counts[index],
    }));

    return result;
  } catch (error) {
    console.error("Error fetching user counts:", error);
    return [];
  }
}

module.exports = router;
