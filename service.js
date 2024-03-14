document
  .getElementById("userForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    var genderInput = document.getElementById("gender").value;
    var ageInput = document.getElementById("age").value;
    var estimatedSalaryInput = document.getElementById("estimatedSalary").value;
    var valueK = document.getElementById("k").value;

    // melakukan normalisasi data age dan salary dari input user
    const userData = await fetchData();

    ageInput = parseFloat(ageInput);
    estimatedSalaryInput = parseFloat(estimatedSalaryInput);
    const maxAge = Math.max(...userData.map((user) => user.age));
    const minAge = Math.min(...userData.map((user) => user.age));
    const maxSalary = Math.max(...userData.map((user) => user.estimatedsalary));
    const minSalary = Math.min(...userData.map((user) => user.estimatedsalary));
    var normalizedAge = normalizeValue(ageInput, minAge, maxAge);
    var normalizedSalary = normalizeValue(
      estimatedSalaryInput,
      minSalary,
      maxSalary
    );

    // melihat neighbors yang didapat dari distance yang dihitung
    console.log(
      calculateEuclideanDistance(
        normalizedAge,
        normalizedSalary,
        valueK
      )
    );

    // menentukan nilai purchase dan ditampilkan ke layar
    try {
      const mostFrequentPurchased = await isPurchased(
        normalizedAge,
        normalizedSalary,
        valueK
      );
      document.getElementById("resultPurchased").innerText = JSON.stringify(
        mostFrequentPurchased
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });

// menangkap data dari data json
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

// menampilkan data dari json
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

// normalisasi data dari data json
function normalizeData(userData) {
  const maxAge = Math.max(...userData.map((user) => user.age));
  const minAge = Math.min(...userData.map((user) => user.age));
  const maxEstimatedSalary = Math.max(
    ...userData.map((user) => user.estimatedsalary)
  );
  const minEstimatedSalary = Math.min(
    ...userData.map((user) => user.estimatedsalary)
  );

  const normalizedData = userData.map((user) => ({
    ...user,
    age: (user.age - minAge) / (maxAge - minAge),
    estimatedsalary:
      (user.estimatedsalary - minEstimatedSalary) /
      (maxEstimatedSalary - minEstimatedSalary),
  }));

  return normalizedData;
}

// melakukan perubahan data
async function fetchDataAndTransform() {
  try {
    const data = await fetchData();
    const normalizedData = normalizeData(data);
    return normalizedData;
  } catch (error) {
    console.error("Error fetching and transforming data:", error);
    return null;
  }
}

// menghitung distance, tidak menggunakan gender dalam perhitungan dikarenakan ketika gender diubah menjadi numerik dengan
// nilai Female = 0 dan Male = 1 akan mengubah hasil perhitungan distance ketika user.gender - genderInput menghasilkan 1 pangkat 2
// maka akan menambahkan 1 pada angka di dalam akar
async function calculateEuclideanDistance(
  ageInput,
  estimatedSalaryInput,
  valueK
) {
  try {
    const data = await fetchDataAndTransform();

    var euclideanDistances = data.map(function (user) {
      var distance = Math.sqrt(
          Math.pow(user.age - ageInput, 2) +
          Math.pow(user.estimatedsalary - estimatedSalaryInput, 2)
      );
      return {
        userId: user.userid,
        distance: distance,
        age: user.age,
        estimatedsalary: user.estimatedsalary,
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

// menentukan nilai dari atribut purchase
async function isPurchased(
  ageInput,
  estimatedSalaryInput,
  valueK
) {
  try {
    const topKDistances = await calculateEuclideanDistance(
      ageInput,
      estimatedSalaryInput,
      valueK
    );

    for (const { purchased, distance } of topKDistances) {
      if (distance === 0) {
        return purchased;
      }
    }

    var countPurchasedOne = 0;
    var countPurchasedZero = 0;

    for (const { purchased } of topKDistances) {
      if (purchased === 1) {
        countPurchasedOne++;
      } else if (purchased === 0) {
        countPurchasedZero++;
      }
    }

    var purchased = countPurchasedOne > countPurchasedZero ? 1 : 0;

    return purchased;
  } catch (error) {
    console.error("Error calculating purchased:", error);
    return null;
  }
}

// normalisasi data dari input user
function normalizeValue(value, minValue, maxValue) {
  return (value - minValue) / (maxValue - minValue);
}

displayUserData();
