export const MintingHubABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_zchf",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_factory",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "bid",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "min",
                "type": "uint256"
            }
        ],
        "name": "BidTooLow",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TooLate",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UnexpectedPrice",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UnexpectedSize",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "position",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "number",
                "type": "uint256"
            }
        ],
        "name": "ChallengeAverted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "challenger",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "position",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "size",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "number",
                "type": "uint256"
            }
        ],
        "name": "ChallengeStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "position",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "bid",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "number",
                "type": "uint256"
            }
        ],
        "name": "ChallengeSucceeded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "challengedId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "bidAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "bidder",
                "type": "address"
            }
        ],
        "name": "NewBid",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "position",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "zchf",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "collateral",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            }
        ],
        "name": "PositionOpened",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "collateral",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "PostPonedReturn",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "CHALLENGER_REWARD",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "OPENING_FEE",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_challengeNumber",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_bidAmountZCHF",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expectedSize",
                "type": "uint256"
            }
        ],
        "name": "bid",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "challenges",
        "outputs": [
            {
                "internalType": "address",
                "name": "challenger",
                "type": "address"
            },
            {
                "internalType": "contract IPosition",
                "name": "position",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "size",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "bidder",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "bid",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "position",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_initialCollateral",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_initialMint",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expiration",
                "type": "uint256"
            }
        ],
        "name": "clonePosition",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_challengeNumber",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "postponeCollateralReturn",
                "type": "bool"
            }
        ],
        "name": "end",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_challengeNumber",
                "type": "uint256"
            }
        ],
        "name": "isChallengeOpen",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_positionAddr",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_collateralAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expectedPrice",
                "type": "uint256"
            }
        ],
        "name": "launchChallenge",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "challenge",
                "type": "uint256"
            }
        ],
        "name": "minBid",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_collateralAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_minCollateral",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_initialCollateral",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_mintingMaximum",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_initPeriodSeconds",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_expirationSeconds",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_challengeSeconds",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "_yearlyInterestPPM",
                "type": "uint32"
            },
            {
                "internalType": "uint256",
                "name": "_liqPrice",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "_reservePPM",
                "type": "uint32"
            }
        ],
        "name": "openPosition",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_collateralAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_minCollateral",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_initialCollateral",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_mintingMaximum",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_expirationSeconds",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_challengeSeconds",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "_yearlyInterestPPM",
                "type": "uint32"
            },
            {
                "internalType": "uint256",
                "name": "_liqPrice",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "_reservePPM",
                "type": "uint32"
            }
        ],
        "name": "openPositionOneWeek",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "collateral",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "pendingReturns",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "collateral",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "target",
                "type": "address"
            }
        ],
        "name": "returnPostponedCollateral",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_challengeNumber",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "splitOffAmount",
                "type": "uint256"
            }
        ],
        "name": "splitChallenge",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "zchf",
        "outputs": [
            {
                "internalType": "contract IFrankencoin",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;