document
  .getElementById("userForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    var genderInput = document.getElementById("gender").value;
    var ageInput = document.getElementById("age").value;
    var estimatedSalaryInput = document.getElementById("estimatedSalary").value;
    var valueK = document.getElementById("k").value;

    if (genderInput === "Male") {
      genderInput = 1;
    } else {
      genderInput = 0;
    }
    console.log(genderInput, ageInput, estimatedSalaryInput, valueK);

    console.log(
      calculateEuclideanDistance(
        genderInput,
        ageInput,
        estimatedSalaryInput,
        valueK
      )
    );

    try {
      const mostFrequentPurchased = await isPurchased(
        genderInput,
        ageInput,
        estimatedSalaryInput,
        valueK
      );
      document.getElementById("resultPurchased").innerText = JSON.stringify(
        mostFrequentPurchased
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });

async function fetchData() {
  try {
    const response = await fetch("data_training.json");
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function displayUserData() {
  try {
    const userData = await fetchData();
    var tableBody = $("#userDataBody");

    userData.forEach(function (user) {
      var row = $("<tr>");

      row.append("<td>" + user.userid + "</td>");
      row.append("<td>" + user.gender + "</td>");
      row.append("<td>" + user.age + "</td>");
      row.append("<td>" + user.estimatedsalary + "</td>");
      row.append("<td>" + user.purchased + "</td>");

      tableBody.append(row);
    });

    $("#userDataTable").DataTable({
      pageLength: 25,
    });
  } catch (error) {
    console.error("Error displaying user data:", error);
  }
}

function transformGender(userData) {
  var modifiedUserData = userData.map(function (user) {
    var newUser = Object.assign({}, user);
    if (newUser.gender === "Female") {
      newUser.gender = 0;
    } else if (newUser.gender === "Male") {
      newUser.gender = 1;
    }
    return newUser;
  });

  return modifiedUserData;
}

async function fetchDataAndTransform() {
  try {
    const data = await fetchData();
    const modifiedData = transformGender(data);
    return modifiedData;
  } catch (error) {
    console.error("Error fetching and transforming data:", error);
    return null;
  }
}

async function calculateEuclideanDistance(
  genderInput,
  ageInput,
  estimatedSalaryInput,
  valueK
) {
  try {
    const data = await fetchDataAndTransform();

    var euclideanDistances = data.map(function (user) {
      var distance = Math.sqrt(
        Math.pow(user.gender - genderInput, 2) +
          Math.pow(user.age - ageInput, 2) +
          Math.pow(user.estimatedsalary - estimatedSalaryInput, 2)
      );
      return {
        userId: user.userid,
        distance: distance,
        purchased: user.purchased,
      };
    });

    euclideanDistances.sort((a, b) => a.distance - b.distance);

    var topKDistances = euclideanDistances.slice(0, valueK);

    return topKDistances;
  } catch (error) {
    console.error("Error calculating Euclidean distance:", error);
    return null;
  }
}

async function isPurchased(
  genderInput,
  ageInput,
  estimatedSalaryInput,
  valueK
) {
  try {
    const topKDistances = await calculateEuclideanDistance(
      genderInput,
      ageInput,
      estimatedSalaryInput,
      valueK
    );

    var countPurchasedOne = 0;
    var countPurchasedZero = 0;
    var purchased = 0;

    topKDistances.forEach(({ purchased, distance }) => {
      if (distance === 0) {
        purchased = 1;
        return purchased;
      } else if (purchased === 1) {
        countPurchasedOne++;
      } else if (purchased === 0) {
        countPurchasedZero++;
      }
    });

    var purchased = countPurchasedOne > countPurchasedZero ? 1 : 0;

    return purchased;
  } catch (error) {
    console.error(
      "Error calculating Euclidean distance and finding purchased:",
      error
    );
    return null;
  }
}

displayUserData();
