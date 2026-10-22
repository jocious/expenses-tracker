
// =========================================================
// PERSONAL EXPENSE TRACKER
// =========================================================

// Loads saved expenses from the browser's localStorage.
// If no expenses have been saved yet, start with an empty array.
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Loads the saved monthly budget.
// The value is converted into a number so calculations work correctly.
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

// Stores the index of the expense currently being edited.
// A value of null means the form is adding a new expense.
let editingIndex = null;


// =========================================================
// GET HTML ELEMENTS
// =========================================================

// Finds an HTML element using its unique ID.
function getElement(id) {
    return document.getElementById(id);
}

// Returns today's date in YYYY-MM-DD format using local time.
// Using local time avoids date changes caused by UTC conversion.
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Formats a number as Philippine pesos with two decimal places.
function formatPeso(amount) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Saves the current expense array to the browser.
// The data remains available after the page is refreshed.
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}


// =========================================================
// MONTH AND DATE HELPERS
// =========================================================

// Checks whether an expense belongs to the current calendar month.
// An expense without a valid date is not counted in monthly spending.
function isCurrentMonth(expense) {
    if (!expense.date) {
        return false;
    }

    const expenseDate = new Date(`${expense.date}T12:00:00`);
    const today = new Date();

    return (
        !Number.isNaN(expenseDate.getTime()) &&
        expenseDate.getFullYear() === today.getFullYear() &&
        expenseDate.getMonth() === today.getMonth()
    );
}

// Adds the amounts of expenses recorded during the current month.
function calculateMonthlySpending() {
    return expenses.reduce((sum, expense) => {
        if (isCurrentMonth(expense)) {
            return sum + Number(expense.amount);
        }

        return sum;
    }, 0);
}


// =========================================================
// MONTHLY BUDGET
// =========================================================

// Saves the user's monthly budget after checking the entered value.
function saveBudget() {
    const budgetInput = getElement("budgetAmount");
    const enteredBudget = Number(budgetInput.value);

    // Do not accept an empty, zero, negative, or invalid budget.
    if (
        budgetInput.value.trim() === "" ||
        !Number.isFinite(enteredBudget) ||
        enteredBudget <= 0
    ) {
        alert("Please enter a valid budget greater than zero.");
        budgetInput.focus();
        return;
    }

    // Update the budget and save it for future visits.
    monthlyBudget = enteredBudget;
    localStorage.setItem("monthlyBudget", String(monthlyBudget));

    // Refresh the dashboard and budget progress display.
    displayBudget();
    displayCategoryTotals();
}

// Updates all budget information shown on the page.
function displayBudget() {
    const monthlySpending = calculateMonthlySpending();
    const remaining = monthlyBudget - monthlySpending;

    // Show the current budget and spending.
    getElement("budgetTotal").textContent = formatPeso(monthlyBudget);
    getElement("budgetSpentCopy").textContent = formatPeso(monthlySpending);
    getElement("monthlySpent").textContent = formatPeso(monthlySpending);

    // Show the amount left, or the amount over budget.
    getElement("remainingBudget").textContent = formatPeso(remaining);

    // Change the card appearance if the spending exceeds the budget.
    const remainingCard = document.querySelector(".remaining-card");
    remainingCard.classList.toggle("over-budget", monthlyBudget > 0 && remaining < 0);

    // Calculate how much of the budget has been used.
    let percentageUsed = 0;

    if (monthlyBudget > 0) {
        percentageUsed = (monthlySpending / monthlyBudget) * 100;
    }

    // The bar cannot visually extend beyond 100%.
    const visiblePercentage = Math.min(percentageUsed, 100);

    getElement("budgetProgressFill").style.width =
        `${Math.max(visiblePercentage, 0)}%`;

    // Update the bar color according to the spending level.
    const progressFill = getElement("budgetProgressFill");

    if (monthlyBudget > 0 && monthlySpending > monthlyBudget) {
        progressFill.style.backgroundColor = "firebrick";
    } else if (monthlyBudget > 0 && percentageUsed >= 80) {
        progressFill.style.backgroundColor = "darkorange";
    } else {
        progressFill.style.backgroundColor = "mediumseagreen";
    }

    // Update the accessible progress-bar value.
    const progressBar = getElement("budgetProgress");
    progressBar.setAttribute(
        "aria-valuenow",
        String(Math.round(visiblePercentage))
    );

    // Display a message that explains the current budget status.
    const budgetMessage = getElement("budgetMessage");
    const budgetStatus = getElement("budgetStatus");

    if (monthlyBudget <= 0) {
        budgetMessage.textContent = "Set a monthly budget to begin.";
        budgetStatus.textContent =
            "Set a budget to track your spending progress.";
    } else if (remaining < 0) {
        budgetMessage.textContent = "You are over budget.";
        budgetStatus.textContent =
            `You exceeded your budget by ${formatPeso(Math.abs(remaining))}.`;
    } else if (remaining === 0) {
        budgetMessage.textContent = "Your budget is fully used.";
        budgetStatus.textContent = "You have used 100% of your monthly budget.";
    } else if (percentageUsed >= 80) {
        budgetMessage.textContent = "Your budget is almost used.";
        budgetStatus.textContent =
            `${percentageUsed.toFixed(1)}% of your budget has been used.`;
    } else {
        budgetMessage.textContent = "You are within budget.";
        budgetStatus.textContent =
            `${percentageUsed.toFixed(1)}% of your budget has been used.`;
    }
}


// =========================================================
// MONTHLY CATEGORY DASHBOARD
// =========================================================

// Calculates current-month spending for each available category.
// These totals are independent of the search and category filters.
function displayCategoryTotals() {
    const categoryContainer = getElement("categoryTotals");

    const categories = ["Food", "Transport", "School", "Other"];

    // Start each category at zero.
    const categoryAmounts = {
        Food: 0,
        Transport: 0,
        School: 0,
        Other: 0
    };

    // Only include expenses recorded during the current month.
    expenses.forEach((expense) => {
        if (isCurrentMonth(expense) && categories.includes(expense.category)) {
            categoryAmounts[expense.category] += Number(expense.amount);
        }
    });

    // Find the highest category total to scale the progress bars.
    const highestAmount = Math.max(
        ...categories.map((category) => categoryAmounts[category]),
        0
    );

    // Clear the previous category rows before creating updated ones.
    categoryContainer.replaceChildren();

    // Create one row for every category.
    categories.forEach((category) => {
        const amount = categoryAmounts[category];

        // Calculate the category bar's width relative to the highest category.
        // If every category is zero, keep all bars at zero percent.
        const percentage = highestAmount > 0
            ? (amount / highestAmount) * 100
            : 0;

        const row = document.createElement("div");
        row.className = "category-row";

        const heading = document.createElement("div");
        heading.className = "category-heading";

        const name = document.createElement("span");
        name.className = "category-name";
        name.textContent = category;

        const amountLabel = document.createElement("span");
        amountLabel.className = "category-amount";
        amountLabel.textContent = formatPeso(amount);

        heading.append(name, amountLabel);

        const track = document.createElement("div");
        track.className = "category-progress-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", `${category} spending`);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", String(Math.round(percentage)));

        const fill = document.createElement("div");
        fill.className = "category-progress-fill";
        fill.style.width = `${percentage}%`;

        track.appendChild(fill);
        row.append(heading, track);
        categoryContainer.appendChild(row);
    });

    // Display an explanation when there are no expenses this month.
    const monthlySpending = calculateMonthlySpending();

    if (monthlySpending === 0) {
        const message = document.createElement("p");
        message.className = "category-empty";
        message.textContent =
            "No spending recorded this month. Add an expense to see your category totals.";
        categoryContainer.appendChild(message);
    }
}


// =========================================================
// ADDING AND EDITING EXPENSES
// =========================================================

// Handles both new expenses and updates to existing expenses.
function addExpense(event) {
    // Prevent the browser from reloading the page after form submission.
    event.preventDefault();

    const nameInput = getElement("expenseName");
    const amountInput = getElement("expenseAmount");
    const categoryInput = getElement("expenseCategory");
    const dateInput = getElement("expenseDate");

    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);
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
        amountInput.value.trim() === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    // Validate the date and prevent dates later than today.
    if (
        date === "" ||
        Number.isNaN(new Date(`${date}T12:00:00`).getTime()) ||
        date > getTodayDate()
    ) {
        alert("Please enter a valid expense date that is not in the future.");
        dateInput.focus();
        return;
    }

    // Keep the expense information in one object.
    const expenseData = {
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    if (editingIndex !== null) {
        // Replace the selected expense rather than creating a duplicate.
        expenses[editingIndex] = expenseData;
    } else {
        // Add a new expense to the array.
        expenses.push(expenseData);
    }

    // Save the updated expenses.
    saveExpenses();

    // Return the form to its normal Add Expense state.
    cancelEditing();

    // Refresh the expense list and all dashboard totals.
    refreshDisplay();
}

// Loads an expense into the form so the user can edit it.
function editExpense(index) {
    const expense = expenses[index];

    // Stop if the selected expense no longer exists.
    if (!expense) {
        return;
    }

    editingIndex = index;

    getElement("expenseName").value = expense.name;
    getElement("expenseAmount").value = expense.amount;
    getElement("expenseCategory").value = expense.category;

    // Use today's date if an older saved record has no date.
    getElement("expenseDate").value = expense.date || getTodayDate();

    // Change the form heading and button text to indicate editing.
    getElement("expenseFormTitle").textContent = "Edit Expense";
    getElement("addExpenseButton").textContent = "Save Changes";
    getElement("cancelEditButton").hidden = false;

    // Bring the form into view and focus the expense name.
    getElement("expenseForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    getElement("expenseName").focus();
}

// Cancels editing and restores the normal add-expense form.
function cancelEditing() {
    editingIndex = null;

    getElement("expenseForm").reset();
    getElement("expenseDate").value = getTodayDate();

    getElement("expenseFormTitle").textContent = "Add an Expense";
    getElement("addExpenseButton").textContent = "Add Expense";
    getElement("cancelEditButton").hidden = true;
}


// =========================================================
// SEARCH AND CATEGORY FILTERS
// =========================================================

// Returns expenses that match both the search text and selected category.
// Each expense keeps its original array index so Edit and Delete target
// the correct record even when the list is filtered.
function getFilteredExpenses() {
    const searchText = getElement("searchExpense").value
        .trim()
        .toLowerCase();

    const selectedCategory = getElement("filterCategory").value;

    return expenses
        .map((expense, index) => ({
            expense: expense,
            index: index
        }))
        .filter(({ expense }) => {
            const matchesName = expense.name
                .toLowerCase()
                .includes(searchText);

            const matchesCategory =
                selectedCategory === "All" ||
                expense.category === selectedCategory;

            return matchesName && matchesCategory;
        });
}

// Clears the search box and restores all categories.
function resetFilters() {
    getElement("searchExpense").value = "";
    getElement("filterCategory").value = "All";

    displayExpenses();
}


// =========================================================
// DISPLAYING EXPENSES
// =========================================================

// Builds and displays the expense list using the current filters.
function displayExpenses() {
    const expenseList = getElement("expenseList");
    const resultCount = getElement("resultCount");

    const filteredExpenses = getFilteredExpenses();

    // Remove old rows before displaying the latest results.
    expenseList.replaceChildren();

    // Update the result count shown above the list.
    resultCount.textContent =
        `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? "" : "s"} found`;

    // Show a message if no expenses match the filters.
    if (filteredExpenses.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";

        if (expenses.length === 0) {
            message.textContent =
                "No expenses yet. Add your first expense above.";
        } else {
            message.textContent =
                "No matching expenses found. Try changing your search or filter.";
        }

        expenseList.appendChild(message);
        return;
    }

    // Create one visual item for every matching expense.
    filteredExpenses.forEach(({ expense, index }) => {
        const item = document.createElement("article");
        item.className = "expense-item";

        const information = document.createElement("div");
        information.className = "expense-information";

        const title = document.createElement("h3");

        // textContent displays user-entered text as text, not executable HTML.
        title.textContent = expense.name;

        const category = document.createElement("p");
        category.textContent = `Category: ${expense.category}`;

        const date = document.createElement("p");
        date.textContent = `Date: ${expense.date || "Not recorded"}`;

        const amount = document.createElement("p");
        amount.className = "expense-amount";
        amount.textContent = formatPeso(Number(expense.amount));

        information.append(title, category, date, amount);

        const actions = document.createElement("div");
        actions.className = "expense-actions";

        // The Edit button uses the original index from the full expense array.
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${expense.name}`);
        editButton.addEventListener("click", () => editExpense(index));

        // The Delete button also targets the original array index.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${expense.name}`);
        deleteButton.addEventListener("click", () => deleteExpense(index));

        actions.append(editButton, deleteButton);
        item.append(information, actions);
        expenseList.appendChild(item);
    });
}


// =========================================================
// DELETING EXPENSES
// =========================================================

// Removes an expense after the user confirms the action.
function deleteExpense(index) {
    const expense = expenses[index];

    if (!expense) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${expense.name}"?`
    );

    if (!confirmed) {
        return;
    }

    // If the expense being edited is deleted, exit editing mode.
    if (editingIndex === index) {
        cancelEditing();
    } else if (editingIndex !== null && index < editingIndex) {
        // Keep the edit index correct if an earlier expense is removed.
        editingIndex -= 1;
    }

    // Remove the selected item from the expense array.
    expenses.splice(index, 1);

    // Save and refresh the list, budget, and category totals.
    saveExpenses();
    refreshDisplay();
}


// =========================================================
// REFRESH ALL DISPLAYED INFORMATION
// =========================================================

// Keeps the expense list and all dashboard figures synchronized.
function refreshDisplay() {
    displayExpenses();
    displayBudget();
    displayCategoryTotals();
}


// =========================================================
// EVENT LISTENERS
// =========================================================

// Submitting the form adds a new expense or saves an edit.
getElement("expenseForm").addEventListener("submit", addExpense);

// Clicking the budget button saves the monthly budget.
getElement("saveBudgetButton").addEventListener("click", saveBudget);

// Clicking Cancel Edit restores the empty form.
getElement("cancelEditButton").addEventListener("click", cancelEditing);

// Refresh the expense list whenever the search text changes.
getElement("searchExpense").addEventListener("input", displayExpenses);

// Refresh the expense list whenever the category filter changes.
getElement("filterCategory").addEventListener("change", displayExpenses);

// Restore all expense records when Reset Filters is clicked.
getElement("resetFiltersButton").addEventListener("click", resetFilters);


// =========================================================
// INITIAL PAGE SETUP
// =========================================================

// Set today's date as the default for a new expense.
getElement("expenseDate").value = getTodayDate();

// Restore the saved budget in the input field.
if (monthlyBudget > 0) {
    getElement("budgetAmount").value = String(monthlyBudget);
}

// Display saved expenses and calculate the dashboard on page load.
refreshDisplay();
