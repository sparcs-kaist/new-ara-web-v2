export interface TOSSection {
  title: string;
  content: string;
}

export interface TOSContent {
  title: string;
  main: string;
  backToHome: string;
  lastUpdated: string;
  tos: TOSSection[];
}

export const tosContent: Record<'ko' | 'en', TOSContent> = {
  ko: {
    title: '이용약관',
    main: '가장 정확한 정보를 가장 신속하게.',
    backToHome: '홈으로 돌아가기',
    lastUpdated: '마지막 업데이트: 2025년 8월 21일',
    tos: [
      {
        title: '제 1 조 (아라의 목적)',
        content: '1. 아라는 KAIST 구성원의 원활한 정보공유를 위해 KAIST 학부 동아리 SPARCS (이하 "SPARCS")에서 제공하는 공용 게시판 서비스 (Bulletin Board System) 입니다.\n\n2. 1조 1항에서의 KAIST 구성원이란 교수, 교직원, 그리고 재학생과 졸업생, 입주 업체 등을 나타냅니다.'
      },
      {
        title: '제 2 조 (가입 및 탈퇴)',
        content: '1. 아라는 KAIST 구성원만 이용 가능합니다.\n\n2. 아라는 SPARCS SSO를 통해 가입할 수 있습니다.\n  - SPARCS SSO에서 카이스트 통합인증으로 가입시 별도 승인 없이 바로 서비스 이용이 가능합니다. (교수, 교직원, 재학생, 졸업생 등)\n  - SPARCS SSO에서 카이스트 통합인증 외 다른 방법으로 가입시 아라 운영진이 승인해야만 서비스 이용이 가능합니다. (입주 업체 등)\n\n3. 아라는 회원탈퇴 기능이 없습니다. 다만, 아라 운영진에게 회원 탈퇴를 요청할 수 있습니다.\n\n4. 다음의 경우에는 회원자격이 박탈될 수 있습니다.\n  - 카이스트 구성원이 아닌 것으로 밝혀졌을 경우\n  - new Ara 이용약관에 명시된 회원의 의무를 지키지 않은 경우\n  - 아라 이용 중 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 관계 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우'
      },
      {
        title: '제 3 조 (회원의 의무)',
        content: '1. 회원은 아라 이용과 관련하여 다음의 행위를 하여서는 안 됩니다.\n  - SPARCS, 아라 운영진, 또는 특정 개인 및 단체를 사칭하는 행위\n  - 아라를 이용하여 얻은 정보를 원작자나 아라 운영진의 사전 승낙 없이 복사, 복제, 변경, 번역, 출판, 방송, 기타의 방법으로 사용하거나 이를 타인에게 제공하는 행위\n  - 다른 회원의 계정을 부정 사용하는 행위\n  - 타인의 명예를 훼손하거나 모욕하는 행위\n  - 타인의 지적재산권 등의 권리를 침해하는 행위\n  - 해킹행위 또는 컴퓨터바이러스의 유포 행위\n  - 광고성 정보 등 일정한 내용을 지속적으로 전송하는 행위\n  - 서비스의 안전적인 운영에 지장을 주거나 줄 우려가 있는 일체의 행위\n  - 범죄행위를 목적으로 하거나 기타 범죄행위와 관련된 행위\n  - SPARCS의 동의 없이 아라를 영리목적으로 사용하는 행위\n  - 기타 아라의 커뮤니티 강령에 반하거나 아라 서비스 운영상 부적절하다고 판단하는 행위\n\n2. 회원은 아라 이용시 모든 상황에서 다음의 커뮤니티 강령을 유의해야합니다.\n  - 언제나 스스로의 말에 책임감을 가져주시기 바랍니다.\n  - KAIST 인권윤리센터의 방침에 따라 증오와 차별 표현은 지양해주시고, 국가인권위원회법이 규정한 평등권 침해의 차별행위가 포함되지 않도록 부탁드립니다.\n  - 국가인권위원회법이 금지하는 차별행위 19가지\n  - 글에 욕설/비속어/은어를 자제해주시기 바랍니다.\n  - 글에 상대방이 불쾌감을 느낄 수 있는 표현, 일체의 성적 대상화를 자제해주시기 바랍니다.'
      },
      {
        title: '제 4 조 (게시물에 대한 권리)',
        content: '1. 회원이 아라 내에 올린 게시물의 저작권은 게시한 회원에게 귀속됩니다.단, SPARCS는 서비스 운영, 기능 개선, 이벤트, 통계, 연구, 인공지능(AI) 학습 및 개발 등 비영리 목적을 포함한 범위에서 별도의 허락 없이 해당 게시물을 무상으로 이용·가공·저장·분석할 수 있으며, 제3자에게 제공할 수 있습니다.\n\n2. 서비스의 게시물 또는 내용물이 위의 약관에 위배될 경우 사전 통지나 동의 없이 삭제될 수 있습니다.\n\n3. 제 3조 회원의 의무에 따라, 아라를 이용하여 얻은 정보를 원작자나 아라 운영진의 사전 승낙 없이 복사, 복제, 변경, 번역, 출판, 방송, 기타의 방법으로 사용하거나, 영리목적으로 활용하거나, 이를 타인에게 제공하는 행위는 금지됩니다. 다만, 제4조 제1항에 따라 SPARCS가 정한 범위에서의 활용은 예외로 합니다.'
      },
      {
        title: '제 5 조 (책임의 제한)',
        content: '1. SPARCS는 다음의 사유로 서비스 제공을 중지하는 것에 대해 책임을 지지 않습니다.\n  - 설비의 보수 등을 위해 부득이한 경우\n  - KAIST가 전기통신서비스를 중지하는 경우\n  - 천재지변, 정전 및 전시 상황인 경우\n  - 기타 본 서비스를 제공할 수 없는 사유가 발생한 경우\n\n2. SPARCS는 다음의 사항에 대해 책임을 지지 않습니다.\n  - 개재된 회원들의 글에 대한 신뢰도, 정확도\n  - 아라를 매개로 회원 상호 간 및 회원과 제 3자 간에 발생한 분쟁\n  - 기타 아라 사용 중 발생한 피해 및 분쟁\n\n3. 법령에 따른 적법한 절차에 의한 경우, SPARCS는 수사기관·사법기관 등 권한 있는 기관에 회원 개인정보 및 게시물·채팅 등 서비스 내 활동 정보를 제공할 수 있습니다.'
      },
      {
        title: '제 6 조 (문의 및 제보)',
        content: '1. 아라에 대한 건의사항 또는 버그에 대한 사항은 구글폼을 통해 문의 및 제보할 수 있습니다. (https://sparcs.page.link/newara-feedback)\n\n2. 6조 1항의 구글폼이 작동하지 않거나, 기타 사항의 경우 new-ara@sparcs.org 를 통해 문의 및 제보할 수 있습니다.'
      },
      {
        title: '제 7 조 (게시, 개정 및 해석)',
        content: '1. 아라 운영진은 본 약관에 대해 아라 회원가입시 회원의 동의를 받습니다.\n\n2. 아라 운영진은 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「개인정보 보호법」, 「저작권법」 등 대한민국 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.\n\n3. 본 약관을 개정하는 경우 적용일자, 개정 내용 및 사유를 명시하여 개정 약관의 적용일자 7일 전부터 적용일자 전일까지 아라의 \'뉴아라 공지\' 게시판을 통해 공지합니다.\n\n4. 회원은 개정약관이 공지된 지 7일 내에 개정약관에 대한 거부의 의사표시를 할 수 있습니다. 이 경우 회원은 아라 운영진에게 메일을 발송하여 즉시 사용 중인 모든 지원 서비스를 해지하고 본 서비스에서 회원 탈퇴할 수 있습니다.\n\n5. 아라 운영진은 개정약관이 공지된 지 7일 내에 거부의 의사표시를 하지 않은 회원에 대해 개정약관에 대해 동의한 것으로 간주합니다.\n\n6. 본 약관의 해석은 아라 운영진이 담당하며, 분쟁이 있을 경우 민법 등 관계 법률과 관례에 따릅니다.'
      },
      {
        title: '제 8 조 (채팅 서비스)',
        content: '1. 아라는 게시판 외에 회원 간의 원활한 의사소통을 위해 채팅 서비스를 제공합니다.\n\n2. 회원은 채팅 서비스를 이용함에 있어 타인의 권리를 침해하거나 불법정보·유해정보를 전송해서는 안 되며, 이를 위반할 경우 이용 제한 등 조치가 취해질 수 있습니다.\n\n3. SPARCS는 채팅 서비스의 안정적 제공 및 법령 준수를 위하여 필요한 경우 채팅 내용을 보관·검토할 수 있으며, 관련 법령에 따라 수사기관 등 권한 있는 기관의 요청이 있을 시 해당 정보를 제공할 수 있습니다.\n\n4.채팅 서비스는 기술적 사정, 보안, 운영정책에 따라 사전 고지 후 변경되거나 중단될 수 있습니다.'
      }
    ]
  },
  en: {
    title: 'Terms of Service',
    main: 'The fastest delivery of the most accurate information',
    backToHome: 'Back to Home',
    lastUpdated: 'Last Updated: August 21, 2025', // Updated date
    tos: [
      {
        title: 'Article 1 (Purpose of Ara)',
        content: '1. Ara is a Bulletin Board System provided by KAIST undergraduate club SPARCS (hereinafter "SPARCS") for smooth information sharing among KAIST members.\n\n2. KAIST members in Article 1, Paragraph 1 refer to professors, faculty, current students, alumni, resident businesses, etc.'
      },
      {
        title: 'Article 2 (Registration and Withdrawal)',
        content: '1. Only KAIST members can use Ara.\n\n2. You can register for Ara through SPARCS SSO.\n  - When registering with KAIST integrated authentication in SPARCS SSO, you can use the service immediately without separate approval. (professors, faculty, current students, alumni, etc.)\n  - When registering with methods other than KAIST integrated authentication in SPARCS SSO, you can use the service only after Ara administrators approve. (resident businesses, etc.)\n\n3. Ara does not have a membership withdrawal function. However, you can request membership withdrawal from Ara administrators.\n\n4. Membership may be revoked in the following cases:\n  - When it is revealed that you are not a KAIST member\n  - When you do not fulfill the obligations of members specified in the new Ara Terms of Service\n  - When you act in violation of the Act on Promotion of Information and Communications Network Utilization and Information Protection, related laws, and this agreement, or against public order and morals while using Ara'
      },
      {
        title: 'Article 3 (Obligations of Members)',
        content: '1. Members should not engage in the following activities related to the use of Ara:\n  - Impersonating SPARCS, Ara administrators, or specific individuals and organizations\n  - Using or providing information obtained through Ara to others by copying, reproducing, modifying, translating, publishing, broadcasting, or other methods without prior consent of the original author or Ara administrators\n  - Unauthorized use of other members\' accounts\n  - Defaming or insulting others\n  - Infringing on others\' intellectual property rights\n  - Hacking or distributing computer viruses\n  - Continuously transmitting certain content, such as advertising information\n  - Any activity that disturbs or may disturb the safe operation of the service\n  - Activities aimed at criminal acts or related to other criminal acts\n  - Using Ara for commercial purposes without SPARCS\'s consent\n  - Other activities that are against Ara\'s community guidelines or deemed inappropriate for Ara service operation\n\n2. Members should be mindful of the following community guidelines in all situations when using Ara:\n  - Always be responsible for your words.\n  - In accordance with KAIST Human Rights Center\'s policy, please refrain from expressions of hatred and discrimination, and ensure that equal rights infringement discrimination acts defined by the National Human Rights Commission Act are not included.\n  - 19 types of discriminatory acts prohibited by the National Human Rights Commission Act\n  - Please refrain from using profanity/slang/jargon in your posts.\n  - Please refrain from expressions that may cause discomfort to others and any form of sexual objectification.'
      },
      {
        title: 'Article 4 (Rights to Posts)',
        content: '1. The copyright of posts uploaded by members within Ara belongs to the posting member. However, SPARCS may, free of charge, use, process, store, and analyze the post without separate permission within a scope that includes non-profit purposes such as service operation, feature improvement, events, statistics, research, and artificial intelligence (AI) learning and development, and may provide it to third parties.\n\n2. Posts or content in the service may be deleted without prior notice or consent if they violate the above terms.\n\n3. In accordance with Article 3 (Obligations of Members), it is prohibited to use information obtained through Ara by copying, reproducing, modifying, translating, publishing, broadcasting, or other methods, utilizing it for commercial purposes, or providing it to others without prior consent of the original author or Ara administrators. However, usage within the scope defined by SPARCS according to Article 4, Paragraph 1 is an exception.'
      },
      {
        title: 'Article 5 (Limitation of Liability)',
        content: '1. SPARCS is not responsible for suspending service provision for the following reasons:\n  - When it is unavoidable for equipment maintenance, etc.\n  - When KAIST suspends telecommunications services\n  - In case of natural disasters, power outages, and war situations\n  - When other reasons arise that make it impossible to provide this service\n\n2. SPARCS is not responsible for the following:\n  - Reliability and accuracy of members\' posts\n  - Disputes between members and between members and third parties mediated by Ara\n  - Other damages and disputes that occur during the use of Ara\n\n3. In case of a lawful procedure according to the law, SPARCS may provide member personal information and service activity information such as posts and chats to authorized institutions such as investigative and judicial agencies.'
      },
      {
        title: 'Article 6 (Inquiries and Reports)',
        content: '1. Suggestions or bug reports about Ara can be submitted through Google Forms. (https://sparcs.page.link/newara-feedback)\n\n2. If the Google Form in Article 6, Paragraph 1 is not working, or for other matters, you can inquire and report through new-ara@sparcs.org.'
      },
      {
        title: 'Article 7 (Posting, Revision, and Interpretation)',
        content: '1. Ara administrators obtain members\' consent to these terms when they register for Ara.\n\n2. Ara administrators may revise these terms within the scope that does not violate the Act on the Regulation of Terms and Conditions, the Act on Promotion of Information and Communications Network Utilization and Information Protection, the Personal Information Protection Act, the Copyright Act, and other relevant laws of the Republic of Korea.\n\n3. When revising these terms, the application date, revised content, and reasons will be specified and announced through Ara\'s \'New Ara Notice\' board from 7 days before the application date of the revised terms until the day before the application date.\n\n4. Members can express their refusal of the revised terms within 7 days after the revised terms are announced. In this case, members can send an email to Ara administrators to immediately terminate all support services in use and withdraw from this service.\n\n5. Ara administrators consider members who do not express their refusal within 7 days after the revised terms are announced to have agreed to the revised terms.\n\n6. The interpretation of these terms is the responsibility of Ara administrators, and in case of disputes, it follows the Civil Act and other related laws and customs.'
      },
      {
        title: 'Article 8 (Chatting Service)',
        content: '1. In addition to the bulletin board, Ara provides a chatting service for smooth communication between members.\n\n2. Members must not infringe on the rights of others or transmit illegal/harmful information when using the chatting service. Violations may result in measures such as usage restrictions.\n\n3. SPARCS may store and review chat content as necessary for stable service provision and legal compliance, and may provide such information to authorized institutions, such as investigative agencies, upon request in accordance with relevant laws.\n\n4. The chatting service may be changed or suspended after prior notice due to technical reasons, security, or operational policies.'
      }
    ]
  }
};