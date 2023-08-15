import React, {} from "react";
import {
    reactExtension,
    useExtensionCapability,
    useBuyerJourneyIntercept,
    useSelectedPaymentOptions,
    useAppMetafields,
    useTotalAmount,
} from "@shopify/ui-extensions-react/checkout";
// Set the entry point for the extension
export default reactExtension("purchase.checkout.actions.render-before", () => <App/>);

function App() {
    // Merchants can toggle the `block_progress` capability behavior within the checkout editor
    const canBlockProgress = useExtensionCapability("block_progress");
    const options = useSelectedPaymentOptions();
    const allMetaFields = useAppMetafields({namespace: "custom"});
    const isDeferred = options.some((option) => option.type === 'deferred');
    const cost = useTotalAmount();

    let companyMetaFields = {};

    console.log(allMetaFields, options);

    allMetaFields.map((m) => {
        if (m.target.type === 'companyLocation') {
            companyMetaFields[m.metafield.key] = m.metafield.value;
        }
    });

    // Use the `buyerJourney` intercept to conditionally block checkout progress
    useBuyerJourneyIntercept(({canBlockProgress}) => {
        // Validate that the age of the buyer is known, and that they're old enough to complete the purchase
        if (canBlockProgress && isDeferred) {
            // const companyId = buyerIdentity.purchasingCompany.current.company.id;
            // const companyLocId = buyerIdentity.purchasingCompany.current.location.id;
            const available = parseFloat(companyMetaFields['available_credit_limit']);
            const spent = parseFloat(companyMetaFields['credits_spent']);
            const orderTotal = cost.amount;
            const currentAvailable = available - spent;
            console.log({
                available: available,
                spent: spent,
                orderTotal: orderTotal,
                currentAvailable: currentAvailable,
            });

            if (currentAvailable < orderTotal) {
                return {
                    behavior: "block",
                    reason: `Credit limit not available`,
                    errors: [
                        {
                            // Show a validation error on the page
                            message: "Credit limit is not available",
                        },
                    ],
                };
            }
        }

        return {
            behavior: "allow",
            perform: () => {
            },
        };
    });

    // Render the extension
    return null;
}
