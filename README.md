
# Notion Table View

This is a Next.js application designed to render a dynamic and interactive table view of data, similar to what you might find in Notion. It allows for column reordering, resizing, sorting, and advanced data filtering.

## Core Features

-   **Table View Rendering**: Displays data in a structured table format.
-   **Column Reordering**: Drag and drop column headers to change their order.
-   **Column Resizing**: Adjust column widths by dragging the edges of column headers.
-   **Data Sorting**: Click on sortable column headers to sort data in ascending or descending order. Sorting is performed server-side.
-   **Dynamic Column Generation**: Columns are configured in the frontend but render data dynamically.
-   **Advanced Data Filtering**:
    -   Access via a modal dialog by clicking the **Filter icon**.
    -   Build complex filter queries using **AND/OR** logical operators for groups of conditions.
    -   Define multiple rules within groups.
    -   **NOT Operator**: Apply logical negation to individual rules (e.g., "Status IS NOT Lead") or entire groups of rules (e.g., "NOT (Priority IS High AND Status IS Proposal)").
        -   When "NOT" is applied to a group, De Morgan's laws are used to transform the query (e.g., `NOT (A AND B)` becomes `(NOT A) OR (NOT B)`).
        -   The UI provides feedback for "NOT" operations:
            -   Buttons toggle between "IS" / "NOT" for rules and "Group" / "NOT Group".
            -   Warnings (text on mobile, tooltip on desktop) appear if "NOT" is applied to a condition that doesn't have a straightforward negation (e.g., "Company ends_with .com"). If such unsupported "NOT" conditions are part of the filter, applying the filter will show an error toast, and the filter builder will reset.
    -   The maximum nesting depth for filter conditions is configurable (default is 2, as per Notion API limits, but the backend can be adjusted).
-   **Data Reset**:
    -   "Reset All Data": Clears all active sorts and filters, fetching the default dataset.
-   **Tooltips**: Icon buttons (like Filter and Reset Data) have tooltips on hover to enhance user experience by providing clear action descriptions.
-   **Responsive Design**: The table and components are designed to be usable on various screen sizes.
-   **Theming**: Styled with a custom ShadCN theme (see `src/app/globals.css`).

## Tech Stack

-   **Frontend**:
    -   Next.js (App Router)
    -   React
    -   TypeScript
    -   ShadCN UI Components
    -   Tailwind CSS
    -   Lucide Icons (for iconography)
    -   Axios (for API communication)
-   **Testing**:
    -   Jest
    -   React Testing Library

## Project Structure

```
/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router: pages, layouts
│   │   ├── globals.css         # Global styles & ShadCN theme
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main application page
│   ├── components/
│   │   ├── notion-table    # Core table component (sort, resize, reorder)
│   │   │   ├── notion-table.tsx # Main table component
│   │   │   ├── table-header-cell.tsx # Table header component
│   │   │   ├── table-cell-content.tsx     # Table cell component
│   │   │   ├── index.ts          # Exports for other components
│   │   ├── notion-filter/ # Advanced filter UI components
│   │   │   ├── filter-builder.tsx # Main logic for filter construction
│   │   │   ├── filter-group.tsx     # Renders a group of filter rules/subgroups
│   │   │   ├── filter-rule.tsx      # Renders a single filter rule
│   │   │   ├── filter.config.ts  # Defines filterable properties & conditions
│   │   │   ├──  filter-types.ts   # TypeScript types for filter structures
            └── index.ts          # Exports for other components   
│   │   └── ui/                   # ShadCN UI components (Button, Card, etc.)
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Hook to detect mobile screen sizes
│   │   ├── use-toast.ts          # Hook for managing toast notifications
        └── index.ts          # Exports for other hooks   
│   ├── lib/
│   │   ├── index.ts        # Exports for other libraries
│   │   └── utils.ts              # Utility functions (e.g., cn for classnames)
│   └── server/                   # Server-side utilities (e.g. httpService)
    │       ├── httpService.ts    # HTTP service for API communication
    │       ├── notion-table.server.ts         # Notion API integration
            └── index.ts            # Exports for other server-side utilities
│   └── types/                    # TypeScript type definitions
├── .env.example                # Example environment variables
├── components.json             # ShadCN UI configuration
├── jest.config.ts              # Jest configuration
├── next.config.ts              # Next.js configuration
├── package.json
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ldhyen99/notion-table-view-and-filters.git
    cd notion-table-view
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

The application fetches data from an external API (e.g., `https://example/api/data` or a local equivalent like `http://localhost:3000/api/data` if you have a local backend running that conforms to the expected request/response structure). Ensure this backend is running and accessible if you are using local endpoints.

To run the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002` (or another port if 9002 is in use).

## Using the Filter Feature

The advanced filter allows you to build complex queries to refine the data displayed in the table.

1.  **Accessing the Filter**:
    *   Click the **Filter icon** (shaped like a funnel) located in the header of the "Notion Database View" card. This will open a modal dialog containing the filter builder.

2.  **Building Filters**:
    *   **Adding Rules**: Click "**+ Add Rule**" to add a new filter condition.
        *   **Property**: Select the data field you want to filter by (e.g., "Company", "Status", "Est. Value").
        *   **Condition**: Choose the comparison operator (e.g., "Is", "Contains", "Is greater than", "Is empty"). The available conditions depend on the selected property's data type.
        *   **Value**: Enter or select the value to compare against. This input changes based on the property and condition (e.g., text input, number input, date picker, select dropdown). Some conditions like "Is empty" do not require a value.
    *   **Adding Groups**: Click "**+ Add Group**" to create a nested group of conditions.
        *   Each group can have its own logical operator ("AND" or "OR").
        *   You can add rules and subgroups within a group, up to the configured nesting limit (default 2 levels, matching Notion API).
    *   **Logical Operators**: For each group (including the root filter), you can choose whether its children conditions should be combined with "AND" (all must be true) or "OR" (any can be true).

3.  **Using the NOT Operator**:
    *   **For Rules**: Each rule has an "IS" button by default. Click it to toggle to "NOT". For example, `Company IS "Acme"` can be changed to `Company NOT "Acme"`.
    *   **For Groups**: Each group has a "Group" button by default. Click it to toggle to "NOT Group". This applies logical negation to the entire group.
        *   Example: `NOT (Priority IS High AND Status IS Proposal)`
    *   **Behavior**:
        -   For simple rules, "NOT" often translates to an inverse condition (e.g., "NOT Is" becomes "Is not", "NOT Contains" becomes "Does not contain").
        -   For checkbox properties, "NOT Is checked" becomes "Is not checked" (API: `equals: false`).
        -   For groups, "NOT" is applied using De Morgan's laws (e.g., `NOT (A AND B)` becomes `(NOT A) OR (NOT B)`). The "NOT" is effectively pushed down to the children, and the group's logical operator flips.
    *   **Unsupported NOT Conditions**: Some conditions, like "ends_with" or "starts_with" for text, do not have simple, direct negations that the Notion API supports.
        -   If you try to apply "NOT" to such a condition, a warning icon (on desktop) or text (on mobile) will appear next to the rule.
        -   If you attempt to apply a filter containing these unsupported "NOT" operations, an error toast will notify you, and the filter builder will be reset to prevent sending an invalid query to the backend.

4.  **Applying Filters**:
    *   Once you've configured your filters, click the "**Apply Filters**" button. The dialog will close, and the table will update with the filtered data.

5.  **Resetting Filters**:
    *   Inside the filter dialog, click "**Reset Filters**" to clear the current filter configuration and close the dialog. The table will show data based on the last applied filter (or default if none was applied).
    *   To reset all data and filters to the application's default state, click the **Reset Data icon** (circular arrow) in the main card header.

## Tooltips

Tooltips are used to improve user experience by providing hints for icon-based buttons. Hover over icons like the **Filter icon**, the **Reset Data icon** or **Column Header** to see a brief description of their function.

## Running Tests

This project uses Jest for testing. To run the tests:

```bash
npm run test
```

This will execute all `*.test.tsx` files in the project.

## Running Docker
To run the application in a Docker container, you can use the following command:
```bash
docker build -t <image-name> .

# Read the .env.local file and set environment variables
docker run -p 3000:3000 --env-file .env.local <image-name>
```

## Contributing
Feel free to submit issues or pull requests for improvements. Ensure all changes include updated unit tests.

## Note
- The unit tests are in progress, some cases are not covered yet.
