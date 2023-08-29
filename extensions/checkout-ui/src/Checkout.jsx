import React, {useState} from "react";
import {
    reactExtension,
    useExtensionCapability,
    useBuyerJourneyIntercept,
    useSelectedPaymentOptions,
    useAppMetafields,
    useTotalAmount,
    Banner,
    Link,
} from "@shopify/ui-extensions-react/checkout";
// Set the entry point for the extension
export default reactExtension("purchase.checkout.block.render", () => <App/>);

function App() {
    // Merchants can toggle the `block_progress` capability behavior within the checkout editor
    const canBlockProgress = useExtensionCapability("block_progress");
    const options = useSelectedPaymentOptions();
    const allMetaFields = useAppMetafields({namespace: "custom"});
    const isDeferred = options.some((option) => option.type === 'deferred');
    const cost = useTotalAmount();
    const [showError, setShowError] = useState(false);

    let companyMetaFields = {};

    console.log(allMetaFields, options, isDeferred);

    allMetaFields.map((m) => {
        if (m.target.type === 'companyLocation') {
            companyMetaFields[m.metafield.key] = m.metafield.value;
        }
    });

    if(!companyMetaFields['credits_spent'])
      companyMetaFields['credits_spent'] = 0;

    if(!companyMetaFields['available_credit_limit'])
      companyMetaFields['available_credit_limit'] = 0;

    // Use the `buyerJourney` intercept to conditionally block checkout progress
    useBuyerJourneyIntercept(({canBlockProgress}) => {

        setShowError(false);

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

            if (available > 0 && currentAvailable < orderTotal) {
                setShowError(true);

                return {
                    behavior: "block",
                    reason: `Credit Limit Exceeded!`,
                    errors: [
                        {
                            // Show a validation error on the page
                            message: `Credit Limit Exceeded!`,
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

    if(showError) {
      // Render the extension
      return (
          <Banner status="critical">Credit Limit Exceeded, To place this order, please pay off existing orders to purchase more gear. You can see your <Link to="https://shopify.com/80518021434/account/orders" external={true}>order here</Link> Contact customer support if you have questions or concerns. Call <Link to="tel:8555103745" external={true}>855 510 3745</Link> Email <Link href="mailto:heythere@epik.us.com" external={true}>heythere@epik.us.com</Link></Banner>
      );
    } else {
      return null;
    }
}
