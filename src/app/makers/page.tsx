'use client';

import React, { useState, useEffect } from 'react';
import MakerCard from './components/MakerCard';

// 포지션 약어 정의
const abbr = {
  SO: 'SysOp',
  PM: 'Project Manager',
  DS: 'Designer',
  DV: 'Developer'
};

// 타입 정의 추가
type MemberString = string; // 예: 'killerwhale:박승범'
type MemberArray = [string, string]; // 예: ['killerwhale:박승범', '2025~']
type Member = MemberString | MemberArray;

type ProjectMembers = {
  SO?: MemberString[];
  PM?: Member[];
  DS?: MemberString[];
  DV?: MemberString[];
};

type Project = {
  name: string;
  period: string;
  launched?: string;
  description?: string;
  members: ProjectMembers;
};

// 프로젝트 데이터 - 모든 프로젝트 포함
const projects: Project[] = [
  {
    name: 'SPARCS BBS', // Eagle BBs 기반 아라
    period: '1991~1998',
    launched: '1991',
    description:
      `1991년에 창립된 SPARCS가 가장 먼저 선보였던 아라입니다.
      Eagle BBS (Pirite BBS) 기반으로 개발된 아라로, 우리나라에서 두번째로 생긴
      Internet에 연결된 BBS (Bulletin Board System) 서비스입니다. 이때부터 아라는
      계속해서 리뉴얼되어 왔으며, 현존하는 BBS 서비스 중에서는 가장 오래되었습니다.`,
    members: {
      SO: ['cdpark:박종대']
    }
  },
  {
    name: 'NeoAra', // NNTP 기반 아라
    period: '1998~2006',
    launched: '1998',
    description:
      `NeoAra는 NewsGroup을 연동하고자 한 NNTP 기반의 아라입니다.
      KAIST 구성원만을 위한 NewsGroup 뿐만 아니라 KAIST 주변의 한국 내 인터넷 사용자
      모두를 위한 NewsGroup 으로서의 역할도 하려고 하였습니다`,
    members: {
      SO: [
        'kaien:박상진', 'godslord:권용철', 'algepher:변창환',
        'neosado:김영준', 'tapung:채주병'
      ]
    }
  },
  {
    name: 'NeoAra & WebAra',
    period: '2006~2008',
    launched: '2006',
    description:
      `NeoAra & WebAra는 웹과의 연동이 시작된 아라입니다.
      덕분에 Telnet, NNTP 뿐만 아니라 Web 으로도 아라를 이용이 가능해졌습니다.
      또한 파일 첨부기능이 추가되어 학우들이 더 다양한 방식으로 아라를 이용할 수 있었습니다.`,
    members: {
      SO: ['airlover:김유승', 'pcpenpal:박용수', 'softdie:김동주']
    }
  },
  {
    name: 'Arara 1세대',
    period: '2008~2010',
    launched: '2008',
    description:
      `Arara 1세대는 유지보수가 어려워진 NeoAra & WebAra를 대체하기 위해 출범하였으며,
      이종 언어가 자유로이 쓰이는 확장가능 구조로 개발되었습니다.
      Python을 기반으로 백엔드에서는 SQLAlchemy, 미들웨어로는 Thrift RPC,
      프론트엔드에서는 Django Template Engine 을 사용하였습니다.`,
    members: {
      DV: [
        'serialx:홍성진', 'pipocket:서우석', 'ssaljalu:조준희', 'breadfish:구성모',
        'jcob:조지혁', 'peremen:박신조', 'combacsa:변규홍'
      ]
    }
  },
  {
    name: 'Arara 2세대', // XpressEngine 기반 아라
    period: '2010~2020',
    launched: '2011',
    description:
      `Arara 2세대는 2010년부터 2020년 10월까지 학우들이 가장 오랫동안 이용한 아라입니다.
      2011년 리뉴얼된 당시 동시접속자수 200명, 하루 평균 접속자수가 7000명으로 KAIST 학내
      공식 커뮤니티로서 아라의 위상을 확인할 수 있었습니다.
      기존 ARAra 엔진 디자인을 새롭게 하고, 동시에 XpressEngine 기반 아라를 개발하려는
      노력이 있었습니다. 또한 RSS 등 사용자들이 필요로 한 기능이 구현되었습니다.`,
    members: {
      PM: ['combacsa:변규홍'],
      DV: [
        'mikkang:김문범', 'reniowood:김진혁', 'harry:이대근', 'jeanclaire:이현진',
        'ssaljalu:조준희', 'anna418:조유정', 'richking:김창하', 'xhark:김재홍',
        'leopine:이가영', 'snogar:차동훈', 'imai:배성경', 'r4t5y6:임규리',
        'kuss:안재만', 'hodduc:이준성', 'leeopop:이근홍'
      ]
    }
  },
  {
    name: '모바일 아라',
    period: '2011~2020',
    launched: '2012',
    description:
      `모바일 아라는 아라를 모바일로 이용하는 수요가 늘면서,
      그에 맞게 디자인을 개선시키고 Arara의 엔진 성능을 개선하고자한 프로젝트입니다.`,
    members: {
      PM: ['hodduc:이준성'],
      DV: [
        'richking:김창하', 'combasa:변규홍', 'grandmarnier:차준호', 'bbashong:최낙현',
        'panda:조민지', 'elaborate:안병욱', 'penguin:민서영', 'pocari:이경태',
        'zzongaly:정진근'
      ]
    }
  },
  {
    name: '아라리',
    period: '2012~2013',
    members: {
      PM: ['zzongaly:정진근'],
      DV: [
        'bbashong:최낙현', 'undead:이창원', 'boolgom:심규민', 'rodumani:정창제',
        'panda:조민지', 'naldo:박지혁', 'yasik:박중언', 'apple:김영석',
        'veritas:정진훈', 'jjus:김지현', 'alice:문슬기', 'penguin:민서영'
      ]
    }
  },
  {
    name: '아라2',
    period: '2013~2014',
    members: {
      PM: ['serialx:홍성진'],
      DV: [
        'hodduc:이준성', 'raon:김강인', 'bbashong:최낙현', 'richking:김창하'
      ]
    }
  },
  {
    name: '아라플러스',
    period: '2015~2016',
    description:
      `아라플러스는 KAIST 학생 사회에서 ARA를 다시 활성화하기 위해, 커뮤니티 활동을 즐길 수
      있는 풍부한 기능들을 새로운 UI와 함께 제공하고자 했던 프로젝트입니다. 사용자들이 특정
      주제에 대해 채팅을 나눌 수 있는 '불판', 동아리나 자치단체, 소모임을 위한 '그룹게시판',
      익명 글작성, 포인트 제도 등 재미있는 기능들이 기획되고 개발되었습니다.`,
    members: {
      PM: [
        'story:김동화', 'kyeome:김태겸'
      ],
      DV: [
        'kanon:김민수', 'apple:김영석', 'zealot:한승현', 'undead:이창원',
        'mandu:황태현', 'samjo:조성원', 'suckzoo:홍석주', 'luan:이상국',
        'george:조형준', 'jara:이문영'
      ]
    }
  },
  {
    name: '뉴아라',
    period: '2017~On-going',
    launched: '2020',
    description:
      `2020년 11월 출범한 뉴아라는 '가장 정확한 정보를 가장 신속하게'라는 슬로건으로 10년간
      이용되던 Arara 를 새롭게 리뉴얼한 프로젝트입니다. 뉴아라에서는 카이스트 포탈공지를
      아라에서도 제공하기 시작했고, 기존 ARA의 게시물과 댓글을 모두 이전시켰음에도 빠른 속도를
      유지했으며, elasticsearch를 도입해 발전된 검색기능을 선보였습니다.
      또한 아라의 아이덴티티가 잘 드러나도록 홈페이지 디자인을 개선하였습니다.`,
    members: {
      PM: [
        ['killerwhale:박승범', '2025~'], ['hyooyh:권효진', '2024'], ['yuwol:황인준', '2022~2023'],
        ['jessie:윤지수', '2021'], ['victory:김주연', '2020'], ['leo:정진우', '2019'],
        ['yujingaya:김유진', '2018'], ['swan:지수환', '2018'], ['raon:김강인', '2017']
      ],
      DV: [
        'platypus:오승빈', 'davin:이다빈',
        'casio:임가은', 'soom:이수민', 'edge:정재현', 'hyuk:장승혁',
        'king:김세종', 'roul:신도윤', 'default:김현수', 'phenol:권영완',
        'arcticfox:고예준', 'alvin:김상오', 'retro:최상아', 'ina:송인화',
        'ddungiii:김기영', 'duncan:이동재', 'panya:김지연', 'ivy:이융희',
        'jungnoh:노정훈', 'water:김윤수', 'triangle:주예준', 'hanski:한석휘',
        'idev:이재현', 'doolly:김제윤', 'nenw:김요한', 'fi:김도현',
        'james:문재호', 'busan:안재웅', 'kidevelop:함종현', 'holymolly:김태원',
        'gunwoo:김건우', 'todo:김동관', 'his:황인승', 'rongrong:이승민',
        'leesia:강현우', 'seol:설윤아', 'youns:최윤서', 'appleseed:강찬규'
      ],
      DS: [
        'cheese:서인성',
        'yumyum:조유민', 'nine:배세윤', 'cheddar:최다은',
        'stitch:이채영', 'zero:임현정', 'luny:김나영'
      ]
    }
  }
];

export default function Makers() {
  const [selected, setSelected] = useState(9); // 기본 선택은 뉴아라 (마지막 항목)
  const positions: (keyof ProjectMembers)[] = ['SO', 'PM', 'DS', 'DV'];

  useEffect(() => {
    document.body.style.background = '#fafafa';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  // 프로젝트 이름 포맷팅
  const projectName = (project: Project) => {
    return project.launched ? `🚀 ${project.name}` : project.name;
  };

  // 멤버 이름 추출
  const memberName = (member: Member) => {
    if (Array.isArray(member)) member = member[0];
    return member.split(':')[1];
  };

  // 멤버 닉네임 추출
  const memberNickname = (member: Member) => {
    if (Array.isArray(member)) member = member[0];
    return member.split(':')[0];
  };

  // 멤버 포지션 포맷팅
  const memberPosition = (member: Member, position: keyof typeof abbr) => {
    if (Array.isArray(member)) {
      return `${member[1]} ${abbr[position]}`;
    } else {
      return abbr[position];
    }
  };

  return (
    <div className="max-w-[1280px] md:w-[80%] w-full mx-auto px-4 py-8 bg-[#fafafa]">
      <h1 className="text-[20px] font-bold leading-[1.45] mb-[18px] lg:mx-[50px] md:mx-0 sm:mx-[30px] mx-[10px]">
        Project
      </h1>

      <div className="grid gap-[15px] justify-center mb-[48px] xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 grid-cols-2 lg:mx-[50px] md:mx-0 sm:mx-[30px] mx-[10px]">
        {projects.map((project, index) => (
          <MakerCard
            key={project.name}
            title={projectName(project)}
            subtitle={project.period}
            active={selected === index}
            launched={project.launched}
            isProject={true}
            onClick={() => setSelected(index)}
          />
        ))}
      </div>
      {projects[selected]?.description && (
        <div className="flex w-full flex-col justify-center my-[48px]">
          <h2 className="text-[20px] font-bold leading-[1.45] mb-[18px] lg:mx-[50px] md:mx-0 sm:mx-[30px] mx-[10px]">
            Description
          </h2>
          <div className="rounded-[10px] shadow-sm bg-white md:p-[22px_64px] p-[22px_22px] mt-[30px] lg:mx-[50px] md:mx-0 sm:mx-[30px] mx-[10px]">
            <p className="text-[16px] font-normal leading-[1.47] text-left">
              {projects[selected].description}
            </p>
          </div>
        </div>
      )}

      <h2 className="text-[20px] font-bold leading-[1.45] mb-[18px] lg:mx-[50px] md:mx-0 sm:mx-[30px] mx-[10px]">
        Member
      </h2>
      <div className="grid gap-[15px] justify-center mt-[48px] mb-[10px] xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 lg:mx-[50px] md:mx-0 sm:mx-[30px] mx-[10px]">
        {positions.map(position =>
          projects[selected].members[position]?.map((member) => (
            <MakerCard
              key={Array.isArray(member) ? member[0] : member}
              title={memberName(member)}
              subtitle={memberNickname(member)}
              position={memberPosition(member, position)}
              isProject={false}
            />
          ))
        )}
      </div>
    </div>
  );
}
