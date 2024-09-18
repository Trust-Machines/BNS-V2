# BNS-V2
## Overview
The BNS-V2 is a decentralized naming system built on the Stacks blockchain. It allows users to register, manage, and transfer names within different namespaces. It offers features for decentralized name management, marketplace integration, and supports both open and managed namespaces. This system can be used to create human-readable identifiers for Stacks and Bitcoin addresses.
## Key Features
- **Namespace Management:** Create and manage namespaces
- **Name Registration:** Register names within namespaces
- **Name Renewals:** Renew name ownership to maintain control
- **Zonefile Updates:** Update information associated with names
- **Name Transfers:** Transfer ownership of names
- **NFT Integration:** Each name is represented as a non-fungible token (NFT)
- **Marketplace Functions:** List and trade names on decentralized marketplaces
- **Managed Namespaces:** Support for namespaces with special rules and management
## Key Concepts
### Namespaces
Namespaces are the top-level domains in BNS (e.g., .btc, .id). They have the following lifecycle:
- **Preorder:** A salted hash of the namespace is submitted with a burn payment
- **Reveal:** The actual namespace is revealed, along with pricing information and all of the namespace properties
- **Launch:** The namespace becomes active, allowing name registrations
### Names
Names are the individual identifiers within a namespace (e.g., alice.btc). They have the following properties:
- Unique within their namespace
- Represented as NFTs
- Can be transferred and renewed
- Associated with a zonefile, which stores additional information related to the name.
### Registration Process
The registration process for a name in BNS-V2 typically involves two steps: 
- Preorder
- Register

During the preorder phase, users submit a salted hash of the fully qualified name (name + namespace) along with the required STX payment. This step prevents front-running by keeping the desired name secret. After 1 bitcoin block, users can reveal the actual name and complete the registration process.

For those seeking a faster registration option, BNS-V2 offers a “fast” registration function which only involves registering the name. Keep in mind this method is susceptible to front-running. 
### Pricing
Name prices are calculated based on:
- Length of the name
- Presence of vowels
- Presence of non-alphabetic characters
- Namespace-specific pricing functions
- **For managed namespaces the pricing will be handled directly by the namespace manager contract**
### NFT Integration
Each name is minted as an NFT, allowing:
- Easy transfers of ownership
- Integration with NFT marketplaces and other applications
### Unmanaged vs Managed Namespaces
BNS-V2 supports two types of namespaces: **Unmanaged** and **Managed**.

Unmanaged namespaces are open for anyone to register names within them, subject to the namespace’s pricing rules. These namespaces operate fully in a decentralized manner, with minimal restrictions on name registration and management.

Managed namespaces, on the other hand, introduce an additional layer of control and customization. These namespaces are overseen by a designated manager who has special privileges and responsibilities. Managed namespaces can implement custom rules for name registration, pricing, transfer and renewals. This allows for use cases such as creating namespaces for specific communities, implementing additional verification processes, or enforcing particular naming conventions.

The key differences between unmanaged and managed namespaces lie in their governance and flexibility. While unmanaged namespaces provide a more open and unrestricted environment, managed namespaces offer greater control and the ability to tailor the namespace to specific requirements or use cases.
## Main Functions
### Namespace Management
- **namespace-preorder:** Reserve a namespace
- **namespace-reveal:** Reveal the namespace and set its properties
- **namespace-launch:** Activate the namespace for name registrations
### Name Registration and Management
- **name-preorder:** Reserve a name
- **name-register:** Register a previously preordered name
- **name-renewal:** Renew a name's registration
- **name-revoke:** Make a name unresolvable
- **update-zonefile-hash:** Update the information for a name
### Fast Registration
- **name-claim-fast:** Register a name in a single transaction (may be front-runnable)
### Managed Namespace Functions (only callable by namespace managers)
- **mng-name-preorder:** Preorder a name in a managed namespace
- **mng-name-register:** Register a name in a managed namespace
- **mng-transfer:** Transfer a name in a managed namespace
- **mng-burn:** Burn a name in a managed namespace
### Marketplace Functions
- **list-in-ustx:** List a name for sale
- **unlist-in-ustx:** Remove a name from sale listing
- **buy-in-ustx:** Purchase a listed name

## Creating A Managed Namespace
### Overview
Managed namespaces are one of the biggest updates in this version of BNSv2. Meant to allow for significant more control & flexibility over a namespace, a "managed" namespace is controlled by a single principal (almost always a *contract* principal). For expected behavior, you must be very careful on setting up this contract principal - if it's not setup correctly, it's possible to to permanently lose control of the namespace.

A few important decisions to make when creating a managed namespace are:
- Will the manager contract *ever* need to be changed?
- How will your mint process work?
- Can managers transfer *any* name?

These are critical decisions that one must consider to future-proof a managed namespace. For the first question, it's almost guranteed that you *will* need to update or remove the manager contract, therefore, it's imperative that manager contract include access to the 'mng-manager-transfer' function. If the initial manager contract does not include this function, it will be impossible to update or remove the namespace to a new manager contract. 

Next, the mint process is vastly more customizable in a managed namespace. At a high-level, managed namespaces have access to the same two paths for name registration: 2 steps / mng-name-preorder + mng-name-register, or a single step / fast-claim. Managed contracts **must** have access to one or both of these functions to successfully mint names in a namespace; additionally, the mint process can be customized to a high degree to allow for: free mints, token-gated mints, variable pricing, sip-10 token support, etc...

Lastly, the ability to allow for the managed namespace contract *itself* to transfer any name is a critical decision. It's almost guranteed that you **don't** want to allow this, as it would allow the contract to transfer any name to any principal; however, there are some use-cases where much more granular control is required. 

## Contributing
We welcome and encourage contributions to the BNS-V2 project! If you’re interested in contributing to the BNS-V2 contract before its deployment to mainnet, please open an issue to allow the team to review your proposed changes or additions.
## License

This project is licensed under the MIT License.

