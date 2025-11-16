package com.aiprompt2draw.converter;

import com.aiprompt2draw.dto.UserConfigDTO;
import com.aiprompt2draw.entity.UserConfig;
import com.aiprompt2draw.vo.UserConfigVO;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户配置转换器
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Component
public class UserConfigConverter {

    /**
     * Entity转VO
     *
     * @param entity 实体
     * @return VO
     */
    public UserConfigVO toVO(UserConfig entity) {
        if (entity == null) {
            return null;
        }

        UserConfigVO vo = new UserConfigVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }

    /**
     * Entity列表转VO列表
     *
     * @param entities 实体列表
     * @return VO列表
     */
    public List<UserConfigVO> toVOList(List<UserConfig> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }

        return entities.stream()
                .map(this::toVO)
                .collect(Collectors.toList());
    }

    /**
     * DTO转Entity
     *
     * @param dto DTO
     * @param apiKeyId API Key ID
     * @return 实体
     */
    public UserConfig toEntity(UserConfigDTO dto, Long apiKeyId) {
        if (dto == null) {
            return null;
        }

        UserConfig entity = new UserConfig();
        BeanUtils.copyProperties(dto, entity);
        entity.setApiKeyId(apiKeyId);

        // 如果DTO中有ID，则设置
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        return entity;
    }

    /**
     * 更新Entity
     *
     * @param entity 原实体
     * @param dto DTO
     * @return 更新后的实体
     */
    public UserConfig updateEntity(UserConfig entity, UserConfigDTO dto) {
        if (entity == null || dto == null) {
            return entity;
        }

        BeanUtils.copyProperties(dto, entity, "id", "apiKeyId", "createTime");

        return entity;
    }
}