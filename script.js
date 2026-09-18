let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function addExpense() {

    let name = document.getElementById("expenseName").value;
    let amount = document.getElementById("expenseAmount").value;
    let category = document.getElementById("expenseCategory").value;

    if (name === "" || amount === "") {
        alert("Please complete the form.");
        return;
    }

    let expense = {
        name: name,
        amount: Number(amount),
        category: category
    };

    expenses.push(expense);

    localStorage.setItem("expenses", JSON.stringify(expenses));

    displayExpenses();

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";
}

function displayExpenses() {

    let list = document.getElementById("expenseList");
    let total = document.getElementById("total");

    list.innerHTML = "";

    let totalAmount = 0;

    expenses.forEach(function(expense, index) {

        totalAmount += expense.amount;

        let item = document.createElement("li");

        item.innerHTML =
            expense.name + " - ₱" +
            expense.amount + " (" +
            expense.category + ")" +
            ' <button class="delete-button" onclick="deleteExpense(' +
            index + ')">Delete</button>';

        list.appendChild(item);
    });

    total.textContent = totalAmount;
}

function deleteExpense(index) {

    expenses.splice(index, 1);

    localStorage.setItem("expenses", JSON.stringify(expenses));

    displayExpenses();
}

displayExpenses();