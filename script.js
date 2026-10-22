
/*
    PERSONAL EXPENSE TRACKER
    Commit 2: Add monthly budget tracking

    Existing features preserved:
    - Add expenses
    - Delete expenses
    - Validate form entries
    - Save expenses using localStorage
    - Display expense history
    - Calculate the total of all expenses

    New features:
    - Save a monthly budget
    - Calculate spending for the current month
    - Show the remaining budget
    - Display a budget progress bar
    - Warn the user when approaching or exceeding the budget
*/

// Load saved expenses, or use an empty array if none exist.
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Load the saved monthly budget separately from the expenses.
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

// Get an HTML element using its ID.
function getElement(id) {
    return document.getElementById(id);
}

// Return today's date in YYYY-MM-DD format using the local date.
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Format a number as Philippine pesos.
function formatPeso(amount) {
    return Number(amount).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
    });
}

// Save all expenses without changing the saved budget.
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Save the monthly budget without changing the expenses.
function saveBudget() {
    const budgetInput = getElement("budgetAmount");
    const budgetValue = budgetInput.value.trim();
    const newBudget = Number(budgetValue);

    // Reject an empty, zero, negative, or invalid budget.
    if (
        budgetValue === "" ||
        !Number.isFinite(newBudget) ||
        newBudget <= 0
    ) {
        alert("Please enter a budget greater than zero.");
        budgetInput.focus();
        return;
    }

    // Update the budget variable.
    monthlyBudget = newBudget;

    // Save the budget separately in the browser.
    localStorage.setItem("monthlyBudget", String(monthlyBudget));

    // Refresh the budget information on the page.
    displayBudget();

    alert("Your monthly budget has been saved.");
}

// Check whether an expense date belongs to the current month.
function isCurrentMonth(dateString) {
    // Older expense entries may not have a date.
    if (!dateString) {
        return false;
    }

    // Compare the YYYY-MM portion of the expense date
    // with the current local year and month.
    const currentMonth = getTodayDate().slice(0, 7);

    return dateString.slice(0, 7) === currentMonth;
}

// Calculate the spending for the current month only.
function calculateMonthlySpending() {
    return expenses.reduce(function(total, expense) {
        // Include only expenses dated in the current month.
        if (isCurrentMonth(expense.date)) {
            return total + (Number(expense.amount) || 0);
        }

        return total;
    }, 0);
}

// Update all monthly budget information.
function displayBudget() {
    const budgetTotal = getElement("budgetTotal");
    const monthlySpent = getElement("monthlySpent");
    const remainingBudget = getElement("remainingBudget");
    const progress = getElement("budgetProgress");
    const progressFill = getElement("budgetProgressFill");
    const message = getElement("budgetMessage");
    const budgetInput = getElement("budgetAmount");

    // Calculate the total spending for this month.
    const spent = calculateMonthlySpending();

    // Calculate how much money remains.
    const remaining = monthlyBudget - spent;

    // Calculate the percentage of the budget used.
    // If no budget exists, keep the percentage at zero.
    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    // Display the budget and spending figures.
    budgetTotal.textContent = formatPeso(monthlyBudget);
    monthlySpent.textContent = formatPeso(spent);
    remainingBudget.textContent = formatPeso(remaining);

    // Show a percentage from zero to 100 on the progress bar.
    // The displayed bar stops at 100%, even if spending exceeds the budget.
    const displayedPercentage = Math.min(percentage, 100);

    progressFill.style.width = `${displayedPercentage}%`;

    // Update accessibility information for the progress bar.
    progress.setAttribute("aria-valuenow", String(
        Math.round(displayedPercentage)
    ));

    // Remove old warning styles before applying new ones.
    message.classList.remove("warning", "over-budget");
    progressFill.classList.remove("warning", "over-budget");

    // Explain the current budget status.
    if (monthlyBudget <= 0) {
        message.textContent =
            "Set a budget to track your monthly spending.";
    } else if (spent > monthlyBudget) {
        message.textContent =
            `You are over budget by ${formatPeso(spent - monthlyBudget)}.`;

        message.classList.add("over-budget");
        progressFill.classList.add("over-budget");
    } else if (spent === monthlyBudget) {
        message.textContent =
            "You have used your entire monthly budget.";

        message.classList.add("warning");
        progressFill.classList.add("warning");
    } else if (percentage >= 80) {
        message.textContent =
            `Warning: You have used ${percentage.toFixed(1)}% of your budget.`;

        message.classList.add("warning");
        progressFill.classList.add("warning");
    } else {
        message.textContent =
            `You have ${formatPeso(remaining)} left for this month.`;
    }

    // Keep the saved budget visible in the input field.
    budgetInput.value = monthlyBudget > 0 ? monthlyBudget : "";
}

// Add a new expense after validating the form.
function addExpense() {
    const nameInput = getElement("expenseName");
    const amountInput = getElement("expenseAmount");
    const categoryInput = getElement("expenseCategory");
    const dateInput = getElement("expenseDate");

    const name = nameInput.value.trim();
    const amountText = amountInput.value.trim();
    const amount = Number(amountText);
    const category = categoryInput.value;
    const date = dateInput.value;

    // Require an expense name.
    if (name === "") {
        alert("Please enter an expense name.");
        nameInput.focus();
        return;
    }

    // Require a valid positive amount.
    if (
        amountText === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    // Require an expense date.
    if (date === "") {
        alert("Please select the expense date.");
        dateInput.focus();
        return;
    }

    // Store the expense as an object.
    const expense = {
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    // Add the new expense to the existing array.
    expenses.push(expense);

    // Save expenses and update both the list and budget.
    saveExpenses();
    displayExpenses();
    displayBudget();

    // Clear the fields after successfully adding the expense.
    nameInput.value = "";
    amountInput.value = "";
    dateInput.value = getTodayDate();

    nameInput.focus();
}

// Display all recorded expenses and calculate their overall total.
function displayExpenses() {
    const list = getElement("expenseList");
    const total = getElement("total");

    // Clear the old list before creating the updated list.
    list.innerHTML = "";

    let totalAmount = 0;

    expenses.forEach(function(expense, index) {
        // Add each expense to the all-time total.
        totalAmount += Number(expense.amount) || 0;

        // Create the list item.
        const item = document.createElement("li");

        // Create the section containing expense details.
        const details = document.createElement("div");
        details.className = "expense-details";

        const expenseName = document.createElement("strong");
        expenseName.textContent = expense.name;

        const expenseInfo = document.createElement("span");
        expenseInfo.className = "expense-info";
        expenseInfo.textContent =
            `${expense.category} | ${expense.date || "Date not recorded"}`;

        const expenseAmount = document.createElement("span");
        expenseAmount.className = "expense-amount";
        expenseAmount.textContent = formatPeso(expense.amount);

        // Add the details to the expense entry.
        details.appendChild(expenseName);
        details.appendChild(expenseInfo);
        details.appendChild(expenseAmount);

        // Create the delete button.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        // Delete the expense when the button is clicked.
        deleteButton.addEventListener("click", function() {
            deleteExpense(index);
        });

        // Put the details and delete button inside the list item.
        item.appendChild(details);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });

    // Display the total of all expenses, not only this month.
    total.textContent = formatPeso(totalAmount);
}

// Delete one expense by its array position.
function deleteExpense(index) {
    // Ensure the index points to an existing expense.
    if (index < 0 || index >= expenses.length) {
        return;
    }

    // Remove the selected expense.
    expenses.splice(index, 1);

    // Save the changes and refresh the display.
    saveExpenses();
    displayExpenses();

    // Recalculate the budget because spending has changed.
    displayBudget();
}

// Connect the buttons to their functions.
getElement("saveBudgetButton").addEventListener("click", saveBudget);
getElement("addExpenseButton").addEventListener("click", addExpense);

// Automatically select today's date when the page opens.
getElement("expenseDate").value = getTodayDate();

// Restore saved information when the page loads.
displayExpenses();
displayBudget();
