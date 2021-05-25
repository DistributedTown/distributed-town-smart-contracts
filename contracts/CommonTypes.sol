//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

library Types {
    struct SkillSet {
        Skill skill1;
        Skill skill2;
        Skill skill3;
    }
    struct Skill {
        uint64 skillId;
        uint8 level;
    }
    enum Template {
        OpenSource, 
        Art, 
        Local,
        Other
    }
}