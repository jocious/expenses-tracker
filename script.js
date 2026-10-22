
/*
    PERSONAL EXPENSE TRACKER
    Commit 4: Add expense editing

    Features:
    - Add and delete expenses
    - Edit expense name, amount, category, and date
    - Save expenses and monthly budget with localStorage
    - Search expenses by name
    - Filter expenses by category
    - Calculate the all-time total
    - Track the current month's budget
*/

// Load expenses and budget from localStorage.
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

// Store the index of the expense currently being edited.
// null means the form is not currently editing an expense.
let editingIndex = null;


// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

// Get an HTML element by its ID.
function getElement(id) {
    return document.getElementById(id);
}

// Return today's local date in YYYY-MM-DD format.
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

// Save the expenses without overwriting the budget.
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}


// --------------------------------------------------
// MONTHLY BUDGET FUNCTIONS
// --------------------------------------------------

// Save the monthly budget.
function saveBudget() {
    const budgetInput = getElement("budgetAmount");
    const budgetText = budgetInput.value.trim();
    const newBudget = Number(budgetText);

    if (
        budgetText === "" ||
        !Number.isFinite(newBudget) ||
        newBudget <= 0
    ) {
        alert("Please enter a budget greater than zero.");
        budgetInput.focus();
        return;
    }

    monthlyBudget = newBudget;
    localStorage.setItem("monthlyBudget", String(monthlyBudget));

    displayBudget();

    alert("Your monthly budget has been saved.");
}

// Check whether an expense date belongs to this month.
function isCurrentMonth(dateString) {
    if (!dateString) {
        return false;
    }

    return dateString.slice(0, 7) === getTodayDate().slice(0, 7);
}

// Calculate spending for the current month.
function calculateMonthlySpending() {
    return expenses.reduce(function(total, expense) {
        if (isCurrentMonth(expense.date)) {
            return total + (Number(expense.amount) || 0);
        }

        return total;
    }, 0);
}

// Display budget totals, remaining balance, progress, and warnings.
function displayBudget() {
    const spent = calculateMonthlySpending();
    const remaining = monthlyBudget - spent;

    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    const progress = getElement("budgetProgress");
    const progressFill = getElement("budgetProgressFill");
    const message = getElement("budgetMessage");

    getElement("budgetTotal").textContent = formatPeso(monthlyBudget);
    getElement("monthlySpent").textContent = formatPeso(spent);
    getElement("remainingBudget").textContent = formatPeso(remaining);

    const displayedPercentage = Math.min(100, Math.max(0, percentage));
    progressFill.style.width = `${displayedPercentage}%`;

    progress.setAttribute(
        "aria-valuenow",
        String(Math.round(displayedPercentage))
    );

    // Remove status colors left by the previous display.
    message.classList.remove("warning", "over-budget");
    progressFill.classList.remove("warning", "over-budget");

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

    // Restore the saved budget in its input field.
    getElement("budgetAmount").value =
        monthlyBudget > 0 ? monthlyBudget : "";
}


// --------------------------------------------------
// ADD OR UPDATE EXPENSE
// --------------------------------------------------

// This function adds a new expense or updates an existing one.
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

    // Validate the expense name.
    if (name === "") {
        alert("Please enter an expense name.");
        nameInput.focus();
        return;
    }

    // Validate the amount.
    if (
        amountText === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    // Validate the date.
    if (date === "") {
        alert("Please select the expense date.");
        dateInput.focus();
        return;
    }

    // Create the updated expense data.
    const expense = {
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    if (editingIndex !== null) {
        // EDIT MODE:
        // Replace the existing expense at its original position.
        expenses[editingIndex] = expense;
    } else {
        // ADD MODE:
        // Add a new expense to the array.
        expenses.push(expense);
    }

    // Save the changes.
    saveExpenses();

    // Exit edit mode and clear the form.
    cancelEditing();

    // Refresh the list, totals, and budget.
    displayExpenses();
    displayBudget();
}


// --------------------------------------------------
// EDIT EXPENSE
// --------------------------------------------------

// Put the selected expense's information into the form.
function editExpense(index) {
    // Make sure the selected expense exists.
    if (index < 0 || index >= expenses.length) {
        return;
    }

    const expense = expenses[index];

    // Remember which expense is being edited.
    editingIndex = index;

    // Fill the form with the existing information.
    getElement("expenseName").value = expense.name;
    getElement("expenseAmount").value = expense.amount;
    getElement("expenseCategory").value = expense.category;
    getElement("expenseDate").value = expense.date || getTodayDate();

    // Change the form heading and main button.
    getElement("expenseFormTitle").textContent = "Edit Expense";
    getElement("addExpenseButton").textContent = "Save Changes";

    // Show the cancel button while editing.
    getElement("cancelEditButton").hidden = false;

    // Move the user to the form.
    getElement("expenseName").focus();
    getElement("expenseFormTitle").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Cancel editing and return the form to add mode.
function cancelEditing() {
    editingIndex = null;

    // Clear the form fields.
    getElement("expenseName").value = "";
    getElement("expenseAmount").value = "";
    getElement("expenseCategory").value = "Food";
    getElement("expenseDate").value = getTodayDate();

    // Restore the original form heading and button text.
    getElement("expenseFormTitle").textContent = "Add an Expense";
    getElement("addExpenseButton").textContent = "Add Expense";

    // Hide the cancel button because edit mode has ended.
    getElement("cancelEditButton").hidden = true;
}


// --------------------------------------------------
// SEARCH AND CATEGORY FILTERS
// --------------------------------------------------

// Return the expenses that match the search and category.
function getFilteredExpenses() {
    const searchText = getElement("searchExpense")
        .value.trim().toLowerCase();

    const selectedCategory = getElement("filterCategory").value;

    // Keep each expense's original index for editing and deleting.
    return expenses
        .map(function(expense, index) {
            return {
                expense: expense,
                originalIndex: index
            };
        })
        .filter(function(entry) {
            const expense = entry.expense;

            const matchesSearch = expense.name
                .toLowerCase()
                .includes(searchText);

            const matchesCategory =
                selectedCategory === "All" ||
                expense.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
}

// Reset search and category filters.
function resetFilters() {
    getElement("searchExpense").value = "";
    getElement("filterCategory").value = "All";

    displayExpenses();
}


// --------------------------------------------------
// DISPLAY EXPENSES
// --------------------------------------------------

// Display the filtered list while keeping totals based on all expenses.
function displayExpenses() {
    const list = getElement("expenseList");
    const total = getElement("total");
    const resultCount = getElement("resultCount");

    list.innerHTML = "";

    // Calculate the all-time total from every saved expense.
    const totalAmount = expenses.reduce(function(sum, expense) {
        return sum + (Number(expense.amount) || 0);
    }, 0);

    total.textContent = formatPeso(totalAmount);

    // Apply the current search and category filter.
    const filteredExpenses = getFilteredExpenses();

    // Display the number of matching expenses.
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

    // Display a message when no expense matches.
    if (filteredExpenses.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-message";

        emptyItem.textContent = expenses.length === 0
            ? "No expenses yet. Add your first expense above."
            : "No expenses match your search or selected category.";

        list.appendChild(emptyItem);
        return;
    }

    // Create one entry for each matching expense.
    filteredExpenses.forEach(function(entry) {
        const expense = entry.expense;
        const originalIndex = entry.originalIndex;

        const item = document.createElement("li");

        // Create the details area.
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

        // Group the Edit and Delete buttons together.
        const actions = document.createElement("div");
        actions.className = "expense-actions";

        // Create the Edit button.
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editExpense(originalIndex);
        });

        // Create the Delete button.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteExpense(originalIndex);
        });

        // Add both buttons to the action area.
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        // Add the details and buttons to the expense entry.
        item.appendChild(details);
        item.appendChild(actions);
        list.appendChild(item);
    });
}


// --------------------------------------------------
// DELETE EXPENSE
// --------------------------------------------------

function deleteExpense(index) {
    if (index < 0 || index >= expenses.length) {
        return;
    }

    // If the expense being edited is deleted, exit edit mode.
    if (editingIndex === index) {
        cancelEditing();
    } else if (editingIndex !== null && index < editingIndex) {
        // Keep the correct editing index if an earlier item is removed.
        editingIndex--;
    }

    // Remove the expense from the array.
    expenses.splice(index, 1);

    saveExpenses();

    // Refresh the list and budget.
    displayExpenses();
    displayBudget();
}


// --------------------------------------------------
// CONNECT BUTTONS AND INPUTS
// --------------------------------------------------

// Save the monthly budget.
getElement("saveBudgetButton").addEventListener("click", saveBudget);

// Add a new expense or save an edited expense.
getElement("addExpenseButton").addEventListener("click", addExpense);

// Cancel the current edit.
getElement("cancelEditButton").addEventListener("click", cancelEditing);

// Update the list while typing a search.
getElement("searchExpense").addEventListener("input", displayExpenses);

// Update the list when a category is selected.
getElement("filterCategory").addEventListener("change", displayExpenses);

// Reset search and category filters.
getElement("resetFiltersButton").addEventListener("click", resetFilters);


// --------------------------------------------------
// INITIAL PAGE SETUP
// --------------------------------------------------

// Set the default expense date to today.
getElement("expenseDate").value = getTodayDate();

// Load the saved expense history and budget.
displayExpenses();
displayBudget();
