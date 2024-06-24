// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0-solc-0.7/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.0-solc-0.7/contracts/token/ERC20/IERC20.sol";

contract CustomToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract FaucetCommunity {
    mapping(uint256 => address[]) public members;
    mapping(address => bool) public isMember;
    mapping(uint256 => IERC20[]) public tokens;

    uint256 public memberCnt = 0;
    uint256 public tokenCnt = 0; 

    event NewMember(uint256 id, address member, address acceptor); 
    event NewToken(uint256 id, string name, string symbol, address token); 
    event NewMint(address member, address to, uint256 amount);

    modifier onlyMember() {
        require(isMember[msg.sender], "Caller is not a member");
        _;
    }

    constructor() {
        members[memberCnt].push(address(msg.sender));
        isMember[address(msg.sender)] = true;
        emit NewMember(memberCnt, address(msg.sender), address(this));
        memberCnt++;
    }

    function initTokens() public onlyMember {
        createToken("Bitcoin", "BTC");
        createToken("Wrapped Ether", "WETH");
        createToken("Uniswap", "UNI");
        createToken("Supercoin", "SUP");
        createToken("Bees Protocol", "BEES");
        createToken("Boss AG", "BOSS");
    }

    function addMember(address member) public onlyMember {
        members[memberCnt].push(member);
        isMember[member] = true;
        emit NewMember(memberCnt, member, msg.sender);
        memberCnt++;

        mintTo(member, 1000);
    }

    function createToken(string memory name, string memory symbol) public onlyMember {
        CustomToken newToken = new CustomToken(name, symbol);
        tokens[tokenCnt].push(newToken);
        emit NewToken(tokenCnt, name, symbol, address(newToken));
        tokenCnt++;
    }

    function mintTo(address to, uint256 amount) public onlyMember {
        for (uint256 i = 0; i < tokenCnt; i++) {
            CustomToken token = CustomToken(address(tokens[i][0]));
            token.mint(to, amount * 10 ** 18);
            emit NewMint(msg.sender, to, amount);
        }
    }

    function mint() public onlyMember {
        mintTo(msg.sender, 1000);
    }
}
