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
### Zonefiles
The zonefile management system differs from the previous (v1) version of BNS. In this update, the Zonefile no longer lives in Gaia/Atlas but rather on-chain in the form of a BNS resolver contract. This contract provides an interface for name owners to read & write their zonefile data directly on-chain. 
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
## Zonefile Resolver Contract
As mentioned above, this update to BNS-V2 introduces a new on-chain zonefile resolver contract. This is done with a single map that stores up to 4096 bytes for the zonefile for a given name & namespace. Anyone can query a name & namespace for a zonefile, but the API, Hiro's, will provide additional support for two different types of zonefile formatting: on-chain or on IPFS. 
### Main Functions
- **resolve-name:** Return the zonefile for a given name
- **update-zonefile:** Update the zonefile for a given name
- **revoke-name:** Revoke a name, making it unresolvable

In short, when writing to a zonefile, the user will be able to choose between on-chain or IPFS storage. If the zonefile size is exactly 34-bytes, the resolver will assume it is an IPFS CID & will perform an additional query. 
## Contributing
We welcome and encourage contributions to the BNS-V2 project! If you’re interested in contributing to the BNS-V2 contract before its deployment to mainnet, please open an issue to allow the team to review your proposed changes or additions.
## License

This project is licensed under the MIT License.

