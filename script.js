
/*
    PERSONAL EXPENSE TRACKER
    Commit 3: Add expense search and category filters

    Features preserved:
    - Add and delete expenses
    - Validate expense details
    - Save expenses and budget using localStorage
    - Display expense dates and Philippine peso amounts
    - Calculate all-time expenses
    - Track the current month's budget
    - Display the budget progress bar and warnings

    New features:
    - Search expenses by name
    - Filter expenses by category
    - Combine search and category filters
    - Count matching expenses
    - Reset search and filters
*/

// Load saved expenses from the browser.
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Load the saved monthly budget.
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;


// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

// Find an HTML element using its ID.
function getElement(id) {
    return document.getElementById(id);
}

// Return today's date in YYYY-MM-DD format.
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

// Save expenses without overwriting the budget.
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}


// --------------------------------------------------
// MONTHLY BUDGET FUNCTIONS
// --------------------------------------------------

// Save the user's monthly budget.
function saveBudget() {
    const budgetInput = getElement("budgetAmount");
    const budgetText = budgetInput.value.trim();
    const newBudget = Number(budgetText);

    // Make sure the budget is a valid positive number.
    if (
        budgetText === "" ||
        !Number.isFinite(newBudget) ||
        newBudget <= 0
    ) {
        alert("Please enter a budget greater than zero.");
        budgetInput.focus();
        return;
    }

    // Update the budget and save it separately.
    monthlyBudget = newBudget;
    localStorage.setItem("monthlyBudget", String(monthlyBudget));

    // Refresh the budget display.
    displayBudget();

    alert("Your monthly budget has been saved.");
}

// Check whether an expense belongs to the current month.
function isCurrentMonth(dateString) {
    if (!dateString) {
        return false;
    }

    return dateString.slice(0, 7) === getTodayDate().slice(0, 7);
}

// Calculate the total spending for the current month.
function calculateMonthlySpending() {
    return expenses.reduce(function(total, expense) {
        if (isCurrentMonth(expense.date)) {
            return total + (Number(expense.amount) || 0);
        }

        return total;
    }, 0);
}

// Display the budget, spending, remaining amount, and progress.
function displayBudget() {
    const spent = calculateMonthlySpending();
    const remaining = monthlyBudget - spent;

    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    const budgetInput = getElement("budgetAmount");
    const progress = getElement("budgetProgress");
    const progressFill = getElement("budgetProgressFill");
    const message = getElement("budgetMessage");

    getElement("budgetTotal").textContent = formatPeso(monthlyBudget);
    getElement("monthlySpent").textContent = formatPeso(spent);
    getElement("remainingBudget").textContent = formatPeso(remaining);

    // Keep the visible progress bar between zero and 100 percent.
    const displayedPercentage = Math.min(100, Math.max(0, percentage));

    progressFill.style.width = `${displayedPercentage}%`;

    // Update the progress bar's accessibility value.
    progress.setAttribute(
        "aria-valuenow",
        String(Math.round(displayedPercentage))
    );

    // Clear warning styles from the previous display.
    message.classList.remove("warning", "over-budget");
    progressFill.classList.remove("warning", "over-budget");

    // Display the correct message for the current budget status.
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

    // Display the currently saved budget in the input field.
    budgetInput.value = monthlyBudget > 0 ? monthlyBudget : "";
}


// --------------------------------------------------
// ADD EXPENSE FUNCTION
// --------------------------------------------------

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

    // Check that the user entered an expense name.
    if (name === "") {
        alert("Please enter an expense name.");
        nameInput.focus();
        return;
    }

    // Check that the amount is a valid positive number.
    if (
        amountText === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    // Check that an expense date was selected.
    if (date === "") {
        alert("Please select the expense date.");
        dateInput.focus();
        return;
    }

    // Create an object containing the expense details.
    const expense = {
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    // Add the expense to the original array.
    expenses.push(expense);

    // Save the expense and refresh the displays.
    saveExpenses();
    displayExpenses();
    displayBudget();

    // Clear the name and amount fields after adding.
    nameInput.value = "";
    amountInput.value = "";

    // Return the date field to today's date.
    dateInput.value = getTodayDate();

    nameInput.focus();
}


// --------------------------------------------------
// SEARCH AND CATEGORY FILTER FUNCTIONS
// --------------------------------------------------

// Return only expenses matching both search and category.
function getFilteredExpenses() {
    const searchText = getElement("searchExpense")
        .value
        .trim()
        .toLowerCase();

    const selectedCategory = getElement("filterCategory").value;

    // Filter the original array without changing saved expenses.
    return expenses
        .map(function(expense, index) {
            // Keep the original index so the correct item can be deleted.
            return {
                expense: expense,
                originalIndex: index
            };
        })
        .filter(function(entry) {
            const expense = entry.expense;

            // Check whether the name contains the search text.
            const matchesSearch = expense.name
                .toLowerCase()
                .includes(searchText);

            // "All" means every category is allowed.
            const matchesCategory =
                selectedCategory === "All" ||
                expense.category === selectedCategory;

            // An expense must pass both conditions.
            return matchesSearch && matchesCategory;
        });
}

// Clear search and category selections.
function resetFilters() {
    getElement("searchExpense").value = "";
    getElement("filterCategory").value = "All";

    // Show the complete expense history again.
    displayExpenses();
}


// --------------------------------------------------
// DISPLAY EXPENSES
// --------------------------------------------------

function displayExpenses() {
    const list = getElement("expenseList");
    const total = getElement("total");
    const resultCount = getElement("resultCount");

    // Clear the previous displayed entries.
    list.innerHTML = "";

    // Calculate the total of every expense, not just filtered entries.
    const totalAmount = expenses.reduce(function(sum, expense) {
        return sum + (Number(expense.amount) || 0);
    }, 0);

    total.textContent = formatPeso(totalAmount);

    // Get the entries that match the current search and filter.
    const filteredExpenses = getFilteredExpenses();

    // Display how many entries match.
    if (
        getElement("searchExpense").value.trim() === "" &&
        getElement("filterCategory").value === "All"
    ) {
        resultCount.textContent =
            `Showing all ${expenses.length} expense(s).`;
    } else {
        resultCount.textContent =
            `Found ${filteredExpenses.length} matching expense(s).`;
    }

    // Show a message when nothing matches the current search.
    if (filteredExpenses.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-message";

        if (expenses.length === 0) {
            emptyItem.textContent =
                "No expenses yet. Add your first expense above.";
        } else {
            emptyItem.textContent =
                "No expenses match your search or selected category.";
        }

        list.appendChild(emptyItem);
        return;
    }

    // Display each matching expense.
    filteredExpenses.forEach(function(entry) {
        const expense = entry.expense;
        const originalIndex = entry.originalIndex;

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

        details.appendChild(expenseName);
        details.appendChild(expenseInfo);
        details.appendChild(expenseAmount);

        // Create a delete button for this expense.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        // Use the original index, not the filtered list's index.
        deleteButton.addEventListener("click", function() {
            deleteExpense(originalIndex);
        });

        item.appendChild(details);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });
}


// --------------------------------------------------
// DELETE EXPENSE FUNCTION
// --------------------------------------------------

function deleteExpense(index) {
    // Stop if the selected index does not exist.
    if (index < 0 || index >= expenses.length) {
        return;
    }

    // Remove the expense from the original array.
    expenses.splice(index, 1);

    // Save the updated array.
    saveExpenses();

    // Refresh the expense history and budget.
    displayExpenses();
    displayBudget();
}


// --------------------------------------------------
// CONNECT BUTTONS AND INPUTS
// --------------------------------------------------

// Save the monthly budget when its button is clicked.
getElement("saveBudgetButton").addEventListener("click", saveBudget);

// Add an expense when the add button is clicked.
getElement("addExpenseButton").addEventListener("click", addExpense);

// Search immediately when the user types.
getElement("searchExpense").addEventListener("input", displayExpenses);

// Refresh the list when the category selection changes.
getElement("filterCategory").addEventListener("change", displayExpenses);

// Clear the search and category filter.
getElement("resetFiltersButton").addEventListener("click", resetFilters);


// --------------------------------------------------
// INITIAL PAGE SETUP
// --------------------------------------------------

// Set the expense date to today.
getElement("expenseDate").value = getTodayDate();

// Restore all expenses and the saved budget on page load.
displayExpenses();
displayBudget();
